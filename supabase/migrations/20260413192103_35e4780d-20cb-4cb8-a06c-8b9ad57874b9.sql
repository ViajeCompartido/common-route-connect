
-- Add 'in_progress' to trip_status enum
ALTER TYPE public.trip_status ADD VALUE IF NOT EXISTS 'in_progress';

-- Add 'held' and 'released' to payment_status enum
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'held';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'released';
