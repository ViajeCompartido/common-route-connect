-- Add vehicle color to driver_profiles
ALTER TABLE public.driver_profiles ADD COLUMN color text;

-- Allow admins to update profiles
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete profiles (deactivate users)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage user_roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update driver_profiles
CREATE POLICY "Admins can update any driver profile"
ON public.driver_profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
