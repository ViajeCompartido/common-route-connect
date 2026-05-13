ALTER TYPE public.trip_status ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS cancelled_by_user boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by_user_id uuid;

CREATE OR REPLACE FUNCTION public.sync_trip_seat_counters(_trip_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total integer;
  _occupied integer;
  _current_status public.trip_status;
  _available integer;
BEGIN
  IF _trip_id IS NULL THEN
    RETURN;
  END IF;

  SELECT total_seats, status
  INTO _total, _current_status
  FROM public.trips
  WHERE id = _trip_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(seats), 0)
  INTO _occupied
  FROM public.bookings
  WHERE trip_id = _trip_id
    AND public.booking_occupies_seat(status);

  _available := GREATEST(_total - _occupied, 0);

  UPDATE public.trips
  SET occupied_seats = _occupied,
      available_seats = _available,
      status = CASE
        WHEN _current_status::text IN ('cancelled', 'completed', 'in_progress', 'paused', 'expired') THEN _current_status
        WHEN _available = 0 THEN 'full'::public.trip_status
        WHEN _current_status = 'full' THEN 'active'::public.trip_status
        ELSE _current_status
      END
  WHERE id = _trip_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booking_seats()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _trip_total integer;
  _trip_status public.trip_status;
  _occupied_without_current integer;
  _available integer;
BEGIN
  IF NEW.seats IS NULL OR NEW.seats < 1 THEN
    RAISE EXCEPTION 'La reserva debe tener al menos 1 asiento';
  END IF;

  IF NOT public.booking_occupies_seat(NEW.status) THEN
    RETURN NEW;
  END IF;

  SELECT total_seats, status
  INTO _trip_total, _trip_status
  FROM public.trips
  WHERE id = NEW.trip_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Viaje no encontrado';
  END IF;

  IF _trip_status::text IN ('cancelled', 'completed', 'in_progress', 'expired') THEN
    RAISE EXCEPTION 'Este viaje ya no acepta nuevas reservas';
  END IF;

  SELECT COALESCE(SUM(seats), 0)
  INTO _occupied_without_current
  FROM public.bookings
  WHERE trip_id = NEW.trip_id
    AND public.booking_occupies_seat(status)
    AND (TG_OP <> 'UPDATE' OR id <> NEW.id);

  _available := _trip_total - _occupied_without_current;

  IF NEW.seats > _available THEN
    RAISE EXCEPTION 'No hay suficientes asientos disponibles para esta reserva';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_manual_trip_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status::text = 'cancelled'
     AND (TG_OP = 'INSERT' OR OLD.status::text IS DISTINCT FROM 'cancelled')
     AND COALESCE(NEW.cancelled_by_user, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'Un viaje solo puede marcarse como cancelado desde una cancelación manual';
  END IF;

  IF NEW.status::text <> 'cancelled' THEN
    NEW.cancelled_by_user := false;
    NEW.cancelled_at := NULL;
    NEW.cancelled_by_user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_manual_trip_cancellation_trigger ON public.trips;
CREATE TRIGGER enforce_manual_trip_cancellation_trigger
BEFORE INSERT OR UPDATE OF status, cancelled_by_user, cancelled_at, cancelled_by_user_id
ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.enforce_manual_trip_cancellation();

CREATE OR REPLACE FUNCTION public.cancel_trip_as_driver(_trip_id uuid, _reason text)
RETURNS json
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

  FOR _booking IN
    SELECT id FROM bookings
    WHERE trip_id = _trip_id
      AND status NOT IN ('completed', 'cancelled_passenger', 'cancelled_driver', 'rejected')
  LOOP
    PERFORM cancel_booking(_booking.id, _reason, 'driver_cancellation');
    _cancelled_count := _cancelled_count + 1;
  END LOOP;

  UPDATE trips
  SET status = 'cancelled',
      cancelled_by_user = true,
      cancelled_at = now(),
      cancelled_by_user_id = _user_id
  WHERE id = _trip_id;

  RETURN json_build_object('cancelled_bookings', _cancelled_count);
END;
$$;