CREATE OR REPLACE FUNCTION public.notify_driver_on_booking_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _trip RECORD;
  _passenger_name text;
BEGIN
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT origin, destination, date, time INTO _trip FROM public.trips WHERE id = NEW.trip_id;
  SELECT (first_name || ' ' || last_name) INTO _passenger_name FROM public.profiles WHERE id = NEW.passenger_id;

  INSERT INTO public.notifications(user_id, type, title, body, data)
  VALUES (
    NEW.driver_id,
    'booking_request',
    COALESCE(NULLIF(trim(_passenger_name), ''), 'Un pasajero') || ' solicitó tu viaje',
    COALESCE(_trip.origin, '') || ' → ' || COALESCE(_trip.destination, '') ||
      CASE WHEN _trip.date IS NOT NULL THEN ' · ' || to_char(_trip.date, 'DD/MM') || ' ' || to_char(_trip.time, 'HH24:MI') ELSE '' END,
    jsonb_build_object('booking_id', NEW.id, 'trip_id', NEW.trip_id, 'from_user_id', NEW.passenger_id, 'seats', NEW.seats)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_driver_on_booking_request_trigger ON public.bookings;
CREATE TRIGGER notify_driver_on_booking_request_trigger
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_driver_on_booking_request();