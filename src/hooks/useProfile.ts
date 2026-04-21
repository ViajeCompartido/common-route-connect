import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  verified: boolean;
  average_rating: number;
  total_ratings: number;
  total_trips: number;
  punctuality: number | null;
  cancellation_rate: number | null;
  created_at: string;
}

export interface DriverProfileData {
  vehicle: string;
  plate: string;
  max_seats: number;
  accepts_pets: boolean;
  pet_sizes_accepted: string[];
  license_url: string | null;
  license_verified: boolean;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfileData | null>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const [{ data: profileData }, { data: driverData }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('driver_profiles').select('vehicle, plate, max_seats, accepts_pets, pet_sizes_accepted, license_url, license_verified').eq('user_id', user.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', user.id),
    ]);

    if (profileData) setProfile(profileData as ProfileData);
    if (driverData) setDriverProfile(driverData as DriverProfileData);
    const roleList = (roles ?? []).map(r => r.role);
    setIsDriver(roleList.includes('driver'));
    setIsAdmin(roleList.includes('admin'));
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, [user]);

  const isProfileComplete = profile
    ? !!(profile.first_name && profile.last_name && profile.phone)
    : false;

  const isDriverProfileComplete = driverProfile
    ? !!(driverProfile.vehicle && driverProfile.plate && driverProfile.license_url)
    : false;

  return {
    profile, driverProfile, isDriver, isAdmin, loading,
    isProfileComplete, isDriverProfileComplete,
    reload: loadProfile,
  };
}
