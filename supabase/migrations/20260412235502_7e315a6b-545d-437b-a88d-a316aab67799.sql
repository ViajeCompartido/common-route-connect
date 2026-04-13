
-- Add pet_sizes_accepted to driver_profiles
ALTER TABLE public.driver_profiles ADD COLUMN pet_sizes_accepted text[] DEFAULT '{}';

-- Add pet_size to trips (driver's own pet size if traveling with pet)
ALTER TABLE public.trips ADD COLUMN pet_size text;

-- Add pet_size to ride_requests
ALTER TABLE public.ride_requests ADD COLUMN pet_size text;

-- Add pet_size and pet_surcharge to bookings
ALTER TABLE public.bookings ADD COLUMN pet_size text;
ALTER TABLE public.bookings ADD COLUMN pet_surcharge numeric DEFAULT 0;

-- Create pet surcharges config table
CREATE TABLE public.pet_surcharges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  size text NOT NULL UNIQUE,
  surcharge numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_surcharges ENABLE ROW LEVEL SECURITY;

-- Everyone can read surcharges (public pricing info)
CREATE POLICY "Anyone can view pet surcharges"
ON public.pet_surcharges FOR SELECT
USING (true);

-- Only admins can modify surcharges
CREATE POLICY "Admins can manage pet surcharges"
ON public.pet_surcharges FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default surcharges
INSERT INTO public.pet_surcharges (size, surcharge) VALUES
  ('small', 500),
  ('medium', 1000),
  ('large', 1500);
