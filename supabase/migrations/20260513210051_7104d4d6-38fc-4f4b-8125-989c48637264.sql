
-- ============= trip_offers =============
CREATE TABLE public.trip_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  ride_request_id uuid,
  driver_id uuid NOT NULL,
  passenger_id uuid NOT NULL,
  initiated_by text NOT NULL CHECK (initiated_by IN ('driver','passenger')),
  seats integer NOT NULL DEFAULT 1 CHECK (seats >= 1),
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled','expired')),
  booking_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Evitar ofertas duplicadas activas para el mismo trip+pasajero
CREATE UNIQUE INDEX trip_offers_unique_active
  ON public.trip_offers (trip_id, passenger_id)
  WHERE status IN ('pending','accepted');

CREATE INDEX trip_offers_driver_idx ON public.trip_offers(driver_id);
CREATE INDEX trip_offers_passenger_idx ON public.trip_offers(passenger_id);
CREATE INDEX trip_offers_trip_idx ON public.trip_offers(trip_id);

ALTER TABLE public.trip_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view offers" ON public.trip_offers
  FOR SELECT USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

CREATE POLICY "Driver or passenger create offer" ON public.trip_offers
  FOR INSERT WITH CHECK (
    (initiated_by = 'driver' AND auth.uid() = driver_id)
    OR (initiated_by = 'passenger' AND auth.uid() = passenger_id)
  );

CREATE POLICY "Participants update offers" ON public.trip_offers
  FOR UPDATE USING (auth.uid() = driver_id OR auth.uid() = passenger_id);

CREATE TRIGGER trip_offers_updated_at
  BEFORE UPDATE ON public.trip_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= notifications =============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Inserción solo via SECURITY DEFINER functions; no INSERT policy publica.

-- ============= RPC: create_trip_offer =============
CREATE OR REPLACE FUNCTION public.create_trip_offer(
  _trip_id uuid,
  _passenger_id uuid,
  _ride_request_id uuid DEFAULT NULL,
  _seats integer DEFAULT 1,
  _message text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _trip RECORD;
  _initiated_by text;
  _other_user uuid;
  _offer_id uuid;
  _driver_name text;
  _passenger_name text;
  _existing uuid;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;

  SELECT * INTO _trip FROM trips WHERE id = _trip_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado'; END IF;

  IF _user_id = _trip.driver_id THEN
    _initiated_by := 'driver';
    _other_user := _passenger_id;
  ELSIF _user_id = _passenger_id THEN
    _initiated_by := 'passenger';
    _other_user := _trip.driver_id;
  ELSE
    RAISE EXCEPTION 'No autorizado para esta oferta';
  END IF;

  IF _trip.driver_id = _passenger_id THEN
    RAISE EXCEPTION 'No podés ofrecerte un viaje a vos mismo';
  END IF;

  IF _trip.available_seats < _seats THEN
    RAISE EXCEPTION 'No hay suficientes asientos disponibles';
  END IF;

  -- duplicado activo
  SELECT id INTO _existing FROM trip_offers
   WHERE trip_id = _trip_id AND passenger_id = _passenger_id
     AND status IN ('pending','accepted') LIMIT 1;
  IF _existing IS NOT NULL THEN
    RAISE EXCEPTION 'Ya existe una oferta activa para este pasajero';
  END IF;

  INSERT INTO trip_offers(trip_id, ride_request_id, driver_id, passenger_id, initiated_by, seats, message)
  VALUES (_trip_id, _ride_request_id, _trip.driver_id, _passenger_id, _initiated_by, _seats, _message)
  RETURNING id INTO _offer_id;

  SELECT (first_name || ' ' || last_name) INTO _driver_name FROM profiles WHERE id = _trip.driver_id;
  SELECT (first_name || ' ' || last_name) INTO _passenger_name FROM profiles WHERE id = _passenger_id;

  -- notificación al otro usuario
  IF _initiated_by = 'driver' THEN
    INSERT INTO notifications(user_id, type, title, body, data)
    VALUES (
      _passenger_id, 'offer_received',
      COALESCE(_driver_name,'Un chofer') || ' te ofreció un viaje',
      _trip.origin || ' → ' || _trip.destination || ' · ' || to_char(_trip.date,'DD/MM') || ' ' || to_char(_trip.time,'HH24:MI'),
      jsonb_build_object('offer_id', _offer_id, 'trip_id', _trip_id, 'from_user_id', _trip.driver_id)
    );
  ELSE
    INSERT INTO notifications(user_id, type, title, body, data)
    VALUES (
      _trip.driver_id, 'offer_received',
      COALESCE(_passenger_name,'Un pasajero') || ' quiere sumarse a tu viaje',
      _trip.origin || ' → ' || _trip.destination || ' · ' || to_char(_trip.date,'DD/MM') || ' ' || to_char(_trip.time,'HH24:MI'),
      jsonb_build_object('offer_id', _offer_id, 'trip_id', _trip_id, 'from_user_id', _passenger_id)
    );
  END IF;

  RETURN _offer_id;
END;
$$;

-- ============= RPC: accept_trip_offer =============
CREATE OR REPLACE FUNCTION public.accept_trip_offer(_offer_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _offer RECORD;
  _trip RECORD;
  _booking_id uuid;
  _accepter_name text;
  _other_user uuid;
  _other_role text;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;

  SELECT * INTO _offer FROM trip_offers WHERE id = _offer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Oferta no encontrada'; END IF;
  IF _offer.status <> 'pending' THEN RAISE EXCEPTION 'La oferta ya no está pendiente'; END IF;

  -- Quien acepta es el receptor (el opuesto al initiated_by)
  IF _offer.initiated_by = 'driver' AND _user_id <> _offer.passenger_id THEN
    RAISE EXCEPTION 'Solo el pasajero puede aceptar';
  END IF;
  IF _offer.initiated_by = 'passenger' AND _user_id <> _offer.driver_id THEN
    RAISE EXCEPTION 'Solo el chofer puede aceptar';
  END IF;

  SELECT * INTO _trip FROM trips WHERE id = _offer.trip_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Viaje no encontrado'; END IF;
  IF _trip.available_seats < _offer.seats THEN
    RAISE EXCEPTION 'Ya no hay asientos suficientes';
  END IF;

  INSERT INTO bookings(trip_id, passenger_id, driver_id, seats, price_per_seat, status)
  VALUES (_offer.trip_id, _offer.passenger_id, _offer.driver_id, _offer.seats, _trip.price_per_seat, 'accepted')
  RETURNING id INTO _booking_id;

  UPDATE trip_offers SET status = 'accepted', booking_id = _booking_id WHERE id = _offer_id;

  -- archivar ride_request si existe
  IF _offer.ride_request_id IS NOT NULL THEN
    UPDATE ride_requests SET status = 'matched' WHERE id = _offer.ride_request_id;
  END IF;

  -- notificar al iniciador
  _other_user := CASE WHEN _offer.initiated_by = 'driver' THEN _offer.driver_id ELSE _offer.passenger_id END;
  SELECT (first_name || ' ' || last_name) INTO _accepter_name FROM profiles WHERE id = _user_id;

  INSERT INTO notifications(user_id, type, title, body, data)
  VALUES (
    _other_user, 'offer_accepted',
    COALESCE(_accepter_name,'El usuario') || ' aceptó tu solicitud',
    _trip.origin || ' → ' || _trip.destination,
    jsonb_build_object('offer_id', _offer_id, 'trip_id', _offer.trip_id, 'booking_id', _booking_id, 'from_user_id', _user_id)
  );

  RETURN _booking_id;
END;
$$;

-- ============= RPC: reject_trip_offer =============
CREATE OR REPLACE FUNCTION public.reject_trip_offer(_offer_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _offer RECORD;
  _trip RECORD;
  _other_user uuid;
  _name text;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Auth required'; END IF;
  SELECT * INTO _offer FROM trip_offers WHERE id = _offer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Oferta no encontrada'; END IF;
  IF _offer.status <> 'pending' THEN RAISE EXCEPTION 'La oferta ya no está pendiente'; END IF;
  IF _user_id NOT IN (_offer.driver_id, _offer.passenger_id) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE trip_offers SET status = 'rejected' WHERE id = _offer_id;

  SELECT * INTO _trip FROM trips WHERE id = _offer.trip_id;
  _other_user := CASE WHEN _user_id = _offer.driver_id THEN _offer.passenger_id ELSE _offer.driver_id END;
  SELECT (first_name || ' ' || last_name) INTO _name FROM profiles WHERE id = _user_id;

  INSERT INTO notifications(user_id, type, title, body, data)
  VALUES (
    _other_user, 'offer_rejected',
    COALESCE(_name,'El usuario') || ' rechazó la oferta',
    COALESCE(_reason, _trip.origin || ' → ' || _trip.destination),
    jsonb_build_object('offer_id', _offer_id, 'trip_id', _offer.trip_id, 'from_user_id', _user_id)
  );
END;
$$;

-- ============= Realtime =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.trip_offers REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
