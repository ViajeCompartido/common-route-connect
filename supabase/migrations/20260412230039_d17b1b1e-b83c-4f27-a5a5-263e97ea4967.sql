-- Storage bucket for license photos
INSERT INTO storage.buckets (id, name, public) VALUES ('licenses', 'licenses', false);

-- Users can upload their own license
CREATE POLICY "Users can upload their own license"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own license
CREATE POLICY "Users can view their own license"
ON storage.objects FOR SELECT
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own license
CREATE POLICY "Users can update their own license"
ON storage.objects FOR UPDATE
USING (bucket_id = 'licenses' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to add driver role securely
CREATE OR REPLACE FUNCTION public.add_driver_role()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'driver')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;