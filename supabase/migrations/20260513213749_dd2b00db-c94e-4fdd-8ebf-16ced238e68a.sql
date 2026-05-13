CREATE OR REPLACE FUNCTION public.enforce_manual_trip_cancellation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status::text = 'cancelled'
     AND (TG_OP = 'INSERT' OR OLD.status::text IS DISTINCT FROM 'cancelled')
     AND COALESCE(current_setting('app.manual_trip_cancellation', true), '') <> 'true' THEN
    RAISE EXCEPTION 'Un viaje solo puede marcarse como cancelado desde una cancelación manual confirmada';
  END IF;

  IF NEW.status::text = 'cancelled' THEN
    NEW.cancelled_by_user := true;
    NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
    NEW.cancelled_by_user_id := COALESCE(NEW.cancelled_by_user_id, auth.uid());
  ELSE
    NEW.cancelled_by_user := false;
    NEW.cancelled_at := NULL;
    NEW.cancelled_by_user_id := NULL;
  END IF;

  RETURN NEW;
END;
$$;

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

  SELECT * INTO _trip FROM trips WHERE id = _trip_id FOR UPDATE;
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

  PERFORM set_config('app.manual_trip_cancellation', 'true', true);

  UPDATE trips
  SET status = 'cancelled',
      cancelled_by_user = true,
      cancelled_at = now(),
      cancelled_by_user_id = _user_id
  WHERE id = _trip_id;

  RETURN json_build_object('cancelled_bookings', _cancelled_count);
END;
$$;