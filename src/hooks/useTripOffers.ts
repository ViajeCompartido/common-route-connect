import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TripOfferRow {
  id: string;
  trip_id: string;
  ride_request_id: string | null;
  driver_id: string;
  passenger_id: string;
  initiated_by: 'driver' | 'passenger';
  seats: number;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  booking_id: string | null;
  created_at: string;
  // joined
  other_user_name: string;
  other_user_avatar: string | null;
  trip_origin: string;
  trip_destination: string;
  trip_date: string;
  trip_time: string;
  trip_price: number;
}

/**
 * Loads trip offers where the current user is involved.
 * - asDriver: offers for trips published by the user.
 * - asPassenger: offers received as passenger (or sent as passenger).
 */
export function useTripOffers(scope: 'asDriver' | 'asPassenger') {
  const { user } = useAuth();
  const [offers, setOffers] = useState<TripOfferRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setOffers([]); setLoading(false); return; }
    setLoading(true);
    const col = scope === 'asDriver' ? 'driver_id' : 'passenger_id';
    const { data } = await supabase
      .from('trip_offers' as any)
      .select('*')
      .eq(col, user.id)
      .in('status', ['pending', 'accepted', 'rejected'])
      .order('created_at', { ascending: false });
    const rows = (data ?? []) as any[];
    if (rows.length === 0) { setOffers([]); setLoading(false); return; }

    const tripIds = [...new Set(rows.map(o => o.trip_id))];
    const otherIds = [...new Set(rows.map(o => scope === 'asDriver' ? o.passenger_id : o.driver_id))];
    const [{ data: trips }, { data: profiles }] = await Promise.all([
      supabase.from('trips').select('id, origin, destination, date, time, price_per_seat').in('id', tripIds),
      supabase.from('profiles').select('id, first_name, last_name, avatar_url').in('id', otherIds),
    ]);
    const tMap = new Map((trips ?? []).map(t => [t.id, t]));
    const pMap = new Map((profiles ?? []).map(p => [p.id, p]));

    setOffers(rows.map((o: any) => {
      const t = tMap.get(o.trip_id);
      const otherId = scope === 'asDriver' ? o.passenger_id : o.driver_id;
      const p = pMap.get(otherId);
      return {
        ...o,
        other_user_name: p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Usuario' : 'Usuario',
        other_user_avatar: p?.avatar_url ?? null,
        trip_origin: t?.origin ?? '',
        trip_destination: t?.destination ?? '',
        trip_date: t?.date ?? '',
        trip_time: t?.time ?? '',
        trip_price: Number(t?.price_per_seat ?? 0),
      } as TripOfferRow;
    }));
    setLoading(false);
  }, [user, scope]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`trip-offers-${scope}-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_offers' }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, scope, load]);

  return { offers, loading, reload: load };
}
