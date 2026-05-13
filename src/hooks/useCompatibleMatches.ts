import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isLocationCompatible, isTimeCompatible, isDateCompatible } from '@/lib/fuzzyMatch';
import { isTripExpired } from '@/lib/tripUtils';

export interface CompatiblePassenger {
  id: string; // ride_request id
  passenger_id: string;
  passenger_name: string;
  avatar_url: string | null;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  message: string | null;
  has_pet: boolean;
  has_luggage: boolean;
  matchLabel: string;
  hasOffer: boolean;
  offerStatus?: string;
}

export interface CompatibleTrip {
  id: string; // trip id
  driver_id: string;
  driver_name: string;
  avatar_url: string | null;
  origin: string;
  destination: string;
  date: string;
  time: string;
  available_seats: number;
  price_per_seat: number;
  matchLabel: string;
  hasOffer: boolean;
  offerStatus?: string;
}

interface DriverCriteria { tripId: string; origin: string; destination: string; date: string; time: string; seats: number; }
interface PassengerCriteria { requestId: string; origin: string; destination: string; date: string; time: string; seats: number; }

export function useCompatiblePassengers(criteria: DriverCriteria | null) {
  const [matches, setMatches] = useState<CompatiblePassenger[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!criteria) { setMatches([]); return; }
    setLoading(true);

    const { data: requests } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('status', 'active');

    const candidates = (requests ?? []).filter(r => {
      if (isTripExpired(r.date, r.time)) return false;
      if (r.seats > criteria.seats) return false;
      const o = isLocationCompatible(criteria.origin, r.origin);
      const d = isLocationCompatible(criteria.destination, r.destination);
      const t = isTimeCompatible(criteria.time, r.time, 120);
      const dt = isDateCompatible(criteria.date, r.date);
      return o.match && d.match && t.match && dt.match;
    });

    if (candidates.length === 0) { setMatches([]); setLoading(false); return; }

    const passengerIds = [...new Set(candidates.map(c => c.passenger_id))];
    const [{ data: profiles }, { data: offers }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', passengerIds),
      supabase.from('trip_offers' as any).select('passenger_id, status').eq('trip_id', criteria.tripId),
    ]);
    const pMap = new Map((profiles ?? []).map(p => [p.id, p]));
    const offerMap = new Map(((offers as any[]) ?? []).map((o: any) => [o.passenger_id, o.status]));

    setMatches(candidates.map(r => {
      const p = pMap.get(r.passenger_id);
      const offerStatus = offerMap.get(r.passenger_id);
      const o = isLocationCompatible(criteria.origin, r.origin);
      const t = isTimeCompatible(criteria.time, r.time, 120);
      const label = o.score === 1 && t.diffMinutes === 0 ? 'Coincidencia exacta' : t.label || 'Compatible';
      return {
        id: r.id,
        passenger_id: r.passenger_id,
        passenger_name: p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Pasajero' : 'Pasajero',
        avatar_url: p?.avatar_url ?? null,
        origin: r.origin, destination: r.destination, date: r.date, time: r.time,
        seats: r.seats, message: r.message, has_pet: r.has_pet, has_luggage: r.has_luggage,
        matchLabel: label,
        hasOffer: !!offerStatus,
        offerStatus,
      };
    }));
    setLoading(false);
  }, [criteria?.tripId, criteria?.origin, criteria?.destination, criteria?.date, criteria?.time, criteria?.seats]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!criteria) return;
    const ch = supabase
      .channel(`compat-pass-${criteria.tripId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_requests' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_offers' }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [criteria?.tripId, load]);

  return { matches, loading, reload: load };
}

export function useCompatibleTrips(criteria: PassengerCriteria | null, currentUserId: string | undefined) {
  const [matches, setMatches] = useState<CompatibleTrip[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!criteria) { setMatches([]); return; }
    setLoading(true);

    const { data: trips } = await supabase
      .from('trips')
      .select('*')
      .in('status', ['active', 'full']);

    const candidates = (trips ?? []).filter(t => {
      if (t.driver_id === currentUserId) return false;
      if (isTripExpired(t.date, t.time)) return false;
      if (t.available_seats < criteria.seats) return false;
      const o = isLocationCompatible(criteria.origin, t.origin);
      const d = isLocationCompatible(criteria.destination, t.destination);
      const tm = isTimeCompatible(criteria.time, t.time, 120);
      const dt = isDateCompatible(criteria.date, t.date);
      return o.match && d.match && tm.match && dt.match;
    });

    if (candidates.length === 0) { setMatches([]); setLoading(false); return; }

    const driverIds = [...new Set(candidates.map(c => c.driver_id))];
    const tripIds = candidates.map(c => c.id);
    const [{ data: profiles }, { data: offers }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', driverIds),
      supabase.from('trip_offers' as any).select('trip_id, status').in('trip_id', tripIds).eq('passenger_id', currentUserId ?? ''),
    ]);
    const pMap = new Map((profiles ?? []).map(p => [p.id, p]));
    const offerMap = new Map(((offers as any[]) ?? []).map((o: any) => [o.trip_id, o.status]));

    setMatches(candidates.map(t => {
      const p = pMap.get(t.driver_id);
      const offerStatus = offerMap.get(t.id);
      const o = isLocationCompatible(criteria.origin, t.origin);
      const tm = isTimeCompatible(criteria.time, t.time, 120);
      const label = o.score === 1 && tm.diffMinutes === 0 ? 'Coincidencia exacta' : tm.label || 'Compatible';
      return {
        id: t.id,
        driver_id: t.driver_id,
        driver_name: p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Chofer' : 'Chofer',
        avatar_url: p?.avatar_url ?? null,
        origin: t.origin, destination: t.destination, date: t.date, time: t.time,
        available_seats: t.available_seats,
        price_per_seat: Number(t.price_per_seat),
        matchLabel: label,
        hasOffer: !!offerStatus,
        offerStatus,
      };
    }));
    setLoading(false);
  }, [criteria?.requestId, criteria?.origin, criteria?.destination, criteria?.date, criteria?.time, criteria?.seats, currentUserId]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!criteria) return;
    const ch = supabase
      .channel(`compat-trips-${criteria.requestId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_offers' }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [criteria?.requestId, load]);

  return { matches, loading, reload: load };
}
