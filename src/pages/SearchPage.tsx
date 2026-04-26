import { useState, useEffect, useCallback } from 'react';
import SearchForm, { SearchFilters } from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import BottomNav from '@/components/BottomNav';
import { computeMatchScore, MatchResult } from '@/lib/fuzzyMatch';
import { ArrowLeft, Sparkles, Car, Hand, Bell, Menu, Zap, ChevronRight, Route, ShieldCheck } from 'lucide-react';
import weegoLogo from '@/assets/weego-logo.png';
import searchHero from '@/assets/search-hero.jpg';
import SideMenu from '@/components/SideMenu';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { getSeatSummary } from '@/lib/seatUtils';

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
  const [menuOpen, setMenuOpen] = useState(false);

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

  const mapTrip = (t: any, profile: any): Trip => {
    const summary = getSeatSummary(t.total_seats, t.available_seats);

    return {
      id: t.id,
      driverId: t.driver_id,
      driverName: profile ? `${profile.first_name} ${profile.last_name}`.trim() || 'Chofer' : 'Chofer',
      driverRating: profile?.average_rating ?? 0,
      driverTotalTrips: profile?.total_trips ?? 0,
      driverVerified: profile?.verified ?? false,
      origin: t.origin,
      destination: t.destination,
      zone: t.zone,
      meetingPoint: t.meeting_point,
      date: t.date,
      time: t.time,
      availableSeats: summary.availableSeats,
      totalSeats: summary.totalSeats,
      pricePerSeat: Number(t.price_per_seat),
      acceptsPets: t.accepts_pets,
      hasPet: t.has_pet,
      allowsLuggage: t.allows_luggage,
      observations: t.observations,
      status: t.status,
    };
  };

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

  const quickSuggestions = [
    { origin: 'Bahía Blanca', destination: 'Monte Hermoso' },
    { origin: 'Bahía Blanca', destination: 'Capital Federal' },
  ];

  const handleQuickSearch = (origin: string, destination: string) => {
    void handleSearch({
      origin, destination, date: '', time: '',
      acceptsPets: false, driverHasPet: false, allowsLuggage: false,
      minRating: 0, minSeats: 1,
    });
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />

      {/* Hero header */}
      <div className="relative pb-40 pt-5 overflow-hidden rounded-b-[2rem]">
        {/* Realistic background image */}
        <img
          src={searchHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />
        {/* Dark green overlay — stronger on the left for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/70 to-primary/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-transparent to-primary/40 pointer-events-none" />

        <div className="relative max-w-lg mx-auto px-5">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 active:scale-95 transition"
              aria-label="Abrir menú"
            >
              <Menu className="h-6 w-6" />
            </button>

            <button onClick={() => navigate('/')} className="flex flex-col items-center active:opacity-90">
              <img src={weegoLogo} alt="WEEGO" className="h-16 w-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
            </button>

            <button
              onClick={() => navigate('/notifications')}
              className="h-10 w-10 rounded-full flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/10 active:scale-95 transition relative"
              aria-label="Notificaciones"
            >
              <Bell className="h-6 w-6" />
            </button>
          </div>

          {/* Hero text block — left aligned */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-2 text-left max-w-[68%]"
          >
            <p className="font-heading font-extrabold text-primary-foreground text-xl tracking-[0.18em] mb-3 drop-shadow-md">
              ¡VAMOS!
            </p>
            <h1 className="font-heading font-extrabold text-primary-foreground text-[34px] leading-[1.05] drop-shadow-md">
              ¿A dónde<br />viajamos <span className="text-accent">hoy?</span>
            </h1>
            <p className="text-[15px] font-medium text-primary-foreground/95 mt-4 leading-snug">
              Encontrá viajes compatibles<br />con tu ruta
            </p>
          </motion.div>
        </div>
      </div>

      {/* Floating search card */}
      <div className="max-w-lg mx-auto px-4 -mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-3xl p-5 shadow-[0_24px_60px_-15px_hsl(var(--primary)/0.45)] border border-border/40"
        >
          <SearchForm onSearch={handleSearch} />
        </motion.div>

        {/* Quick suggestions */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="h-7 w-7 rounded-full bg-accent/15 flex items-center justify-center">
              <Zap className="h-4 w-4 text-accent fill-accent" />
            </div>
            <h3 className="text-sm font-heading font-semibold text-foreground">Sugerencias rápidas</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickSuggestions.map((s, i) => (
              <motion.button
                key={`${s.origin}-${s.destination}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={() => handleQuickSearch(s.origin, s.destination)}
                className="flex items-center gap-3 bg-card border border-border/60 rounded-2xl p-3 text-left hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition"
              >
                <div className="h-10 w-10 rounded-full bg-secondary/60 flex items-center justify-center shrink-0">
                  <Route className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{s.origin}</p>
                  <p className="text-xs text-muted-foreground truncate">→ {s.destination}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Trust block */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 flex items-center gap-3 bg-gradient-to-br from-secondary/60 to-card border border-primary/15 rounded-2xl p-4 shadow-sm"
        >
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold text-foreground">Viajá seguro, viajá tranquilo</p>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              Todos los viajes están protegidos por el sistema WEEGO
            </p>
          </div>
        </motion.div>
      </div>

      {/* Results */}
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
