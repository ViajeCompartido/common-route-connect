ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS occupied_seats INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.booking_occupies_seat(_status public.booking_status)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _status NOT IN ('cancelled_passenger', 'cancelled_driver', 'rejected')
$$;

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
        WHEN _current_status IN ('cancelled', 'completed', 'in_progress', 'paused') THEN _current_status
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

  IF _trip_status IN ('cancelled', 'completed', 'in_progress') THEN
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

CREATE OR REPLACE FUNCTION public.validate_trip_seat_counts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _occupied integer := 0;
  _available integer;
BEGIN
  IF NEW.total_seats IS NULL OR NEW.total_seats < 1 THEN
    RAISE EXCEPTION 'El viaje debe ofrecer al menos 1 asiento';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(SUM(seats), 0)
    INTO _occupied
    FROM public.bookings
    WHERE trip_id = NEW.id
      AND public.booking_occupies_seat(status);
  ELSE
    _occupied := COALESCE(NEW.occupied_seats, 0);
  END IF;

  IF NEW.total_seats < _occupied THEN
    RAISE EXCEPTION 'No podés definir menos asientos que los ya reservados';
  END IF;

  _available := GREATEST(NEW.total_seats - _occupied, 0);
  NEW.occupied_seats := _occupied;
  NEW.available_seats := _available;

  IF NEW.status IN ('active', 'full') THEN
    NEW.status := CASE WHEN _available = 0 THEN 'full'::public.trip_status ELSE 'active'::public.trip_status END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_trip_seat_counts_trigger ON public.trips;
CREATE TRIGGER validate_trip_seat_counts_trigger
BEFORE INSERT OR UPDATE OF total_seats, available_seats, occupied_seats, status
ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.validate_trip_seat_counts();

DROP TRIGGER IF EXISTS validate_booking_seats_trigger ON public.bookings;
CREATE TRIGGER validate_booking_seats_trigger
BEFORE INSERT OR UPDATE OF trip_id, seats, status
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_booking_seats();

CREATE OR REPLACE FUNCTION public.handle_booking_seat_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_trip_seat_counters(OLD.trip_id);
    RETURN OLD;
  END IF;

  PERFORM public.sync_trip_seat_counters(NEW.trip_id);

  IF TG_OP = 'UPDATE' AND OLD.trip_id IS DISTINCT FROM NEW.trip_id THEN
    PERFORM public.sync_trip_seat_counters(OLD.trip_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_booking_seat_sync_trigger ON public.bookings;
CREATE TRIGGER handle_booking_seat_sync_trigger
AFTER INSERT OR UPDATE OF trip_id, seats, status OR DELETE
ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_seat_sync();

CREATE INDEX IF NOT EXISTS idx_bookings_trip_status_active_seats
ON public.bookings (trip_id, status)
WHERE status NOT IN ('cancelled_passenger', 'cancelled_driver', 'rejected');

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_active_passenger_trip_unique
ON public.bookings (trip_id, passenger_id)
WHERE status NOT IN ('cancelled_passenger', 'cancelled_driver', 'rejected');

UPDATE public.trips t
SET occupied_seats = sub.occupied,
    available_seats = GREATEST(t.total_seats - sub.occupied, 0),
    status = CASE
      WHEN t.status IN ('cancelled', 'completed', 'in_progress', 'paused') THEN t.status
      WHEN GREATEST(t.total_seats - sub.occupied, 0) = 0 THEN 'full'::public.trip_status
      ELSE 'active'::public.trip_status
    END
FROM (
  SELECT tr.id,
         COALESCE(SUM(b.seats) FILTER (WHERE public.booking_occupies_seat(b.status)), 0) AS occupied
  FROM public.trips tr
  LEFT JOIN public.bookings b ON b.trip_id = tr.id
  GROUP BY tr.id
) sub
WHERE t.id = sub.id;