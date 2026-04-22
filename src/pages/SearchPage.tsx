import { useState, useEffect, useCallback } from 'react';
import SearchForm, { SearchFilters } from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import BottomNav from '@/components/BottomNav';
import { computeMatchScore, MatchResult } from '@/lib/fuzzyMatch';
import { ArrowLeft, Sparkles, Car, Hand } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

interface ScoredTrip {
  trip: Trip;
  match: MatchResult;
  type: 'driver' | 'passenger';
}

import { isTripExpired } from '@/lib/tripUtils';

const compatibilityColor = (score: number) => {
  if (score >= 0.9) return 'bg-green-500/15 text-green-700 border-green-500/30';
  if (score >= 0.7) return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
  if (score >= 0.5) return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
  return 'bg-muted text-muted-foreground border-border';
};

const SearchPage = () => {
  const { user } = useAuth();
  const { isDriver } = useProfile();
  const navigate = useNavigate();
  const [driverResults, setDriverResults] = useState<ScoredTrip[]>([]);
  const [passengerResults, setPassengerResults] = useState<ScoredTrip[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);

    const [tripsRes, reqsRes] = await Promise.all([
      supabase.from('trips').select('*').in('status', ['active']).gt('available_seats', 0).order('date', { ascending: true }),
      supabase.from('ride_requests').select('*').eq('status', 'active').order('created_at', { ascending: false }),
    ]);

    const trips = (tripsRes.data ?? []).filter(t => !isTripExpired(t.date, t.time));
    const reqs = (reqsRes.data ?? []).filter(r => !isTripExpired(r.date, r.time));

    const driverIds = [...new Set(trips.map(t => t.driver_id))];
    const passengerIds = [...new Set(reqs.map(r => r.passenger_id))];
    const allIds = [...new Set([...driverIds, ...passengerIds])];

    const { data: profiles } = allIds.length > 0
      ? await supabase.from('profiles').select('id, first_name, last_name, average_rating, total_trips, verified').in('id', allIds)
      : { data: [] };
    const pm = new Map((profiles ?? []).map(p => [p.id, p]));

    const mappedTrips = trips.map(t => mapTrip(t, pm.get(t.driver_id)));
    const mappedReqs = reqs.map(r => mapRideRequest(r, pm.get(r.passenger_id)));

    setDriverResults(mappedTrips.map(trip => ({ trip, match: defaultMatch(trip.id), type: 'driver' as const })));
    setPassengerResults(mappedReqs.map(trip => ({ trip, match: defaultMatch(trip.id), type: 'passenger' as const })));
    setLoading(false);
  }, []);

  useEffect(() => { void loadAll(); }, [loadAll]);

  useRealtimeRefresh({
    enabled: !hasSearched,
    tables: ['trips', 'ride_requests'],
    onChange: loadAll,
    channelName: 'search-listings-refresh',
  });

  const mapTrip = (t: any, profile: any): Trip => ({
    id: t.id, driverId: t.driver_id, driverName: profile ? `${profile.first_name} ${profile.last_name}`.trim() || 'Chofer' : 'Chofer',
    driverRating: profile?.average_rating ?? 0, driverTotalTrips: profile?.total_trips ?? 0, driverVerified: profile?.verified ?? false,
    origin: t.origin, destination: t.destination, zone: t.zone, meetingPoint: t.meeting_point,
    date: t.date, time: t.time, availableSeats: t.available_seats, totalSeats: t.total_seats,
    pricePerSeat: Number(t.price_per_seat), acceptsPets: t.accepts_pets, hasPet: t.has_pet,
    allowsLuggage: t.allows_luggage, observations: t.observations, status: t.status,
  });

  const mapRideRequest = (r: any, profile: any): Trip => ({
    id: r.id, driverId: r.passenger_id,
    driverName: profile ? `${profile.first_name} ${profile.last_name}`.trim() || 'Pasajero' : 'Pasajero',
    driverRating: profile?.average_rating ?? 0, driverTotalTrips: profile?.total_trips ?? 0, driverVerified: profile?.verified ?? false,
    origin: r.origin, destination: r.destination, date: r.date, time: r.time,
    availableSeats: r.seats, totalSeats: r.seats, pricePerSeat: 0,
    acceptsPets: r.has_pet, hasPet: r.has_pet, allowsLuggage: r.has_luggage, status: 'active' as const,
  });

  const defaultMatch = (id: string): MatchResult => ({
    tripId: id, overallScore: 1,
    originMatch: { match: true, score: 1, label: '' }, destinationMatch: { match: true, score: 1, label: '' },
    timeMatch: { match: true, diffMinutes: 0, label: '' }, dateMatch: { match: true, label: '' }, compatibilityLabel: '',
  });

  const handleSearch = async (filters: SearchFilters) => {
    setHasSearched(true);
    setLoading(true);

    const [tripsRes, reqsRes] = await Promise.all([
      supabase.from('trips').select('*').in('status', ['active']).gt('available_seats', 0),
      supabase.from('ride_requests').select('*').eq('status', 'active'),
    ]);

    const trips = (tripsRes.data ?? []).filter(t => !isTripExpired(t.date, t.time));
    const reqs = (reqsRes.data ?? []).filter(r => !isTripExpired(r.date, r.time));

    const allIds = [...new Set([...trips.map(t => t.driver_id), ...reqs.map(r => r.passenger_id)])];
    const { data: profiles } = allIds.length > 0
      ? await supabase.from('profiles').select('id, first_name, last_name, average_rating, total_trips, verified').in('id', allIds)
      : { data: [] };
    const pm = new Map((profiles ?? []).map(p => [p.id, p]));

    const mappedTrips = trips.map(t => mapTrip(t, pm.get(t.driver_id)));
    const mappedReqs = reqs.map(r => mapRideRequest(r, pm.get(r.passenger_id)));

    // Apply hard filters to trips
    const filteredTrips = mappedTrips.filter(t => {
      if (filters.acceptsPets && !t.acceptsPets) return false;
      if (filters.driverHasPet && !t.hasPet) return false;
      if (filters.allowsLuggage && !t.allowsLuggage) return false;
      if (filters.minRating > 0 && t.driverRating < filters.minRating) return false;
      if (filters.minSeats > 1 && t.availableSeats < filters.minSeats) return false;
      return true;
    });

    // Score both
    const scoreAndFilter = (items: Trip[], type: 'driver' | 'passenger'): ScoredTrip[] =>
      items.map(trip => ({
        trip, type,
        match: computeMatchScore(
          { origin: filters.origin, destination: filters.destination, date: filters.date, time: filters.time },
          trip
        ),
      }))
      .filter(s => {
        if (filters.origin && !s.match.originMatch.match) return false;
        if (filters.destination && !s.match.destinationMatch.match) return false;
        return s.match.overallScore >= 0.2;
      })
      .sort((a, b) => b.match.overallScore - a.match.overallScore);

    setDriverResults(scoreAndFilter(filteredTrips, 'driver'));
    setPassengerResults(scoreAndFilter(mappedReqs, 'passenger'));
    setLoading(false);
  };

  const renderResults = (results: ScoredTrip[]) => (
    <div className="space-y-3">
      {results.map(({ trip, match, type }, i) => (
        <motion.div key={trip.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          {hasSearched && match.compatibilityLabel && (
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${compatibilityColor(match.overallScore)}`}>
                <Sparkles className="h-3 w-3" /> {match.compatibilityLabel}
              </span>
              {match.originMatch.label && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Origen: {match.originMatch.label}</span>}
              {match.timeMatch.label && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{match.timeMatch.label}</span>}
            </div>
          )}
          <TripCard trip={trip} index={i} type={type} viewerIsDriver={isDriver} viewerUserId={user?.id} />
        </motion.div>
      ))}
      {results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No encontramos resultados compatibles.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Probá ampliando la zona o cambiando el horario.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground mb-1">Buscar</h1>
          <p className="text-xs text-primary-foreground/60 mb-4">Buscá viajes y pasajeros compatibles con tu ruta</p>
          <div className="bg-card rounded-2xl p-5 shadow-ocean">
            <SearchForm onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">Buscando...</p></div>
        ) : (
          <Tabs defaultValue="drivers">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="drivers" className="gap-1.5"><Car className="h-3.5 w-3.5" /> Choferes ({driverResults.length})</TabsTrigger>
              <TabsTrigger value="passengers" className="gap-1.5"><Hand className="h-3.5 w-3.5" /> Pasajeros ({passengerResults.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="drivers">{renderResults(driverResults)}</TabsContent>
            <TabsContent value="passengers">{renderResults(passengerResults)}</TabsContent>
          </Tabs>
        )}
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default SearchPage;
