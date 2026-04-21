-- 1. Tabla de política de cancelación editable
CREATE TABLE IF NOT EXISTS public.cancellation_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_hours_before NUMERIC NOT NULL,
  refund_percentage INTEGER NOT NULL CHECK (refund_percentage BETWEEN 0 AND 100),
  applies_to_status TEXT NOT NULL DEFAULT 'paid',
  label TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cancellation_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active policy"
  ON public.cancellation_policy FOR SELECT
  USING (true);

CREATE POLICY "Admins manage policy"
  ON public.cancellation_policy FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cancellation_policy_updated_at
  BEFORE UPDATE ON public.cancellation_policy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed política por defecto
INSERT INTO public.cancellation_policy (min_hours_before, refund_percentage, applies_to_status, label, description) VALUES
  (24, 100, 'paid', 'Más de 24hs antes', 'Reembolso completo al pasajero.'),
  (2, 80, 'paid', 'Entre 2hs y 24hs antes', 'Se retiene el 20% por gestión.'),
  (0, 50, 'paid', 'Menos de 2hs antes', 'Se retiene el 50% como compensación al chofer.'),
  (-9999, 20, 'paid', 'Después de la hora del viaje', 'Se retiene el 80% como no-show.'),
  (0, 30, 'driver_on_way', 'Chofer ya en camino', 'Se retiene el 70% como compensación.'),
  (0, 10, 'driver_arrived', 'Chofer ya llegó', 'Se retiene el 90% como compensación.');

-- 2. Tabla de cancelaciones (historial)
CREATE TABLE IF NOT EXISTS public.cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  cancelled_by_user_id UUID NOT NULL,
  cancelled_by_role TEXT NOT NULL CHECK (cancelled_by_role IN ('passenger', 'driver', 'admin')),
  reason TEXT NOT NULL,
  reason_category TEXT,
  refund_percentage INTEGER NOT NULL DEFAULT 0,
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  refund_status TEXT NOT NULL DEFAULT 'pending' CHECK (refund_status IN ('not_applicable', 'pending', 'processing', 'completed', 'failed')),
  refund_processed_at TIMESTAMPTZ,
  refund_processed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cancellations_booking ON public.cancellations(booking_id);
CREATE INDEX idx_cancellations_user ON public.cancellations(cancelled_by_user_id);
CREATE INDEX idx_cancellations_refund_status ON public.cancellations(refund_status);

ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their cancellations"
  ON public.cancellations FOR SELECT
  USING (
    cancelled_by_user_id = auth.uid()
    OR is_booking_participant(auth.uid(), booking_id)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Participants can create cancellations"
  ON public.cancellations FOR INSERT
  WITH CHECK (
    cancelled_by_user_id = auth.uid()
    AND is_booking_participant(auth.uid(), booking_id)
  );

CREATE POLICY "Admins update cancellations"
  ON public.cancellations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cancellations_updated_at
  BEFORE UPDATE ON public.cancellations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Función central de cancelación
CREATE OR REPLACE FUNCTION public.cancel_booking(
  _booking_id UUID,
  _reason TEXT,
  _reason_category TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _booking RECORD;
  _is_driver BOOLEAN;
  _is_passenger BOOLEAN;
  _refund_pct INTEGER;
  _refund_amount NUMERIC;
  _new_status booking_status;
  _role TEXT;
  _refund_status TEXT;
  _cancellation_id UUID;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Auth required';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RAISE EXCEPTION 'Motivo de cancelación requerido (mínimo 3 caracteres)';
  END IF;

  SELECT b.*, (b.price_per_seat * b.seats + COALESCE(b.pet_surcharge, 0)) AS subtotal
  INTO _booking
  FROM bookings b WHERE b.id = _booking_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Reserva no encontrada'; END IF;

  _is_driver := (_booking.driver_id = _user_id);
  _is_passenger := (_booking.passenger_id = _user_id);
  IF NOT (_is_driver OR _is_passenger) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF _booking.status IN ('completed', 'cancelled_passenger', 'cancelled_driver', 'rejected') THEN
    RAISE EXCEPTION 'Esta reserva ya no se puede cancelar';
  END IF;

  IF _is_driver THEN
    _role := 'driver';
    _new_status := 'cancelled_driver';
    _refund_pct := 100; -- siempre 100% si cancela el chofer
  ELSE
    _role := 'passenger';
    _new_status := 'cancelled_passenger';
    _refund_pct := calculate_refund_percentage(_booking_id);
  END IF;

  -- Reembolso solo aplica si hubo pago
  IF _booking.status IN ('paid', 'driver_on_way', 'driver_arrived', 'in_transit') THEN
    _refund_amount := ROUND(_booking.subtotal * _refund_pct / 100.0, 2);
    _refund_status := CASE WHEN _refund_pct > 0 THEN 'pending' ELSE 'not_applicable' END;
  ELSE
    _refund_amount := 0;
    _refund_status := 'not_applicable';
  END IF;

  -- Update booking
  UPDATE bookings SET status = _new_status, cancellation_reason = _reason WHERE id = _booking_id;

  -- Liberar asiento si todavía estaba reservado
  IF _booking.status IN ('pending', 'accepted', 'coordinating', 'paid') THEN
    UPDATE trips SET available_seats = available_seats + _booking.seats
    WHERE id = _booking.trip_id;
  END IF;

  -- Insertar registro de cancelación
  INSERT INTO cancellations (
    booking_id, trip_id, cancelled_by_user_id, cancelled_by_role,
    reason, reason_category, refund_percentage, refund_amount, refund_status
  ) VALUES (
    _booking_id, _booking.trip_id, _user_id, _role,
    _reason, _reason_category, _refund_pct, _refund_amount, _refund_status
  ) RETURNING id INTO _cancellation_id;

  -- Marcar payment como refunded si aplica
  IF _refund_status = 'pending' THEN
    UPDATE payments SET status = 'refunded' WHERE booking_id = _booking_id AND status IN ('completed', 'held');
  END IF;

  RETURN json_build_object(
    'cancellation_id', _cancellation_id,
    'refund_percentage', _refund_pct,
    'refund_amount', _refund_amount,
    'refund_status', _refund_status,
    'role', _role
  );
END;
$$;

-- 4. Función para que chofer cancele todo el viaje (todas sus reservas)
CREATE OR REPLACE FUNCTION public.cancel_trip_as_driver(
  _trip_id UUID,
  _reason TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _trip RECORD;
  _booking RECORD;
  _cancelled_count INTEGER := 0;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN
    RAISE EXCEPTION 'Motivo requerido';
  END IF;

  SELECT * INTO _trip FROM trips WHERE id = _trip_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado'; END IF;
  IF _trip.driver_id != _user_id THEN RAISE EXCEPTION 'No autorizado'; END IF;

  -- Cancelar cada reserva activa (siempre 100% reembolso)
  FOR _booking IN
    SELECT id FROM bookings
    WHERE trip_id = _trip_id
      AND status NOT IN ('completed', 'cancelled_passenger', 'cancelled_driver', 'rejected')
  LOOP
    PERFORM cancel_booking(_booking.id, _reason, 'driver_cancellation');
    _cancelled_count := _cancelled_count + 1;
  END LOOP;

  -- Marcar viaje como cancelado
  UPDATE trips SET status = 'cancelled' WHERE id = _trip_id;

  RETURN json_build_object('cancelled_bookings', _cancelled_count);
END;
$$;

-- 5. Función para que admin marque reembolso como completado
CREATE OR REPLACE FUNCTION public.mark_refund_completed(
  _cancellation_id UUID,
  _notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Solo admin';
  END IF;
  UPDATE cancellations
  SET refund_status = 'completed',
      refund_processed_at = now(),
      refund_processed_by = auth.uid(),
      notes = COALESCE(_notes, notes)
  WHERE id = _cancellation_id;
END;
$$;