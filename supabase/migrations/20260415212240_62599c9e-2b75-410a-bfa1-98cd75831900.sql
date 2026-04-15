
-- Add new booking progress statuses
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'driver_on_way';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'driver_arrived';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'in_transit';

-- Function to calculate refund percentage based on booking state and time to departure
CREATE OR REPLACE FUNCTION public.calculate_refund_percentage(
  _booking_id uuid
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _status booking_status;
  _trip_date date;
  _trip_time time;
  _departure_ts timestamptz;
  _hours_until numeric;
BEGIN
  -- Get booking status and trip schedule
  SELECT b.status, t.date, t.time
  INTO _status, _trip_date, _trip_time
  FROM bookings b
  JOIN trips t ON t.id = b.trip_id
  WHERE b.id = _booking_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Calculate hours until departure
  _departure_ts := (_trip_date || ' ' || _trip_time)::timestamptz;
  _hours_until := EXTRACT(EPOCH FROM (_departure_ts - now())) / 3600.0;

  -- Already in transit or completed: no refund
  IF _status IN ('in_transit', 'completed') THEN
    RETURN 0;
  END IF;

  -- Driver arrived at meeting point: 10% refund
  IF _status = 'driver_arrived' THEN
    RETURN 10;
  END IF;

  -- Driver on the way: 30% refund
  IF _status = 'driver_on_way' THEN
    RETURN 30;
  END IF;

  -- Paid status: refund based on time
  IF _status = 'paid' THEN
    IF _hours_until > 24 THEN RETURN 100;
    ELSIF _hours_until > 2 THEN RETURN 80;
    ELSIF _hours_until > 0 THEN RETURN 50;
    ELSE RETURN 20; -- past departure time
    END IF;
  END IF;

  -- Pre-payment statuses (pending, accepted, coordinating): full cancel allowed
  IF _status IN ('pending', 'accepted', 'coordinating') THEN
    RETURN 100;
  END IF;

  RETURN 0;
END;
$$;
