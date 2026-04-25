import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Menu, ShieldCheck, Search, Car, UserRound, ChevronRight, Rocket } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RecommendedTripCard from '@/components/RecommendedTripCard';
import SideMenu from '@/components/SideMenu';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { isTripExpired } from '@/lib/tripUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import weegoLogo from '@/assets/weego-logo.png';
import heroCarpool from '@/assets/hero-carpool.jpg';
import illustrationCarpool from '@/assets/illustration-carpool.png';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { getSeatSummary } from '@/lib/seatUtils';

interface RecommendedTrip extends Trip {
  vehicleColor?: string | null;
  tripType: 'direct' | 'with_stops';
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useProfile();
  const [trips, setTrips] = useState<RecommendedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: tripsRes } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'active')
      .gt('available_seats', 0)
      .order('date', { ascending: true })
      .limit(5);

    const tripsData = (tripsRes ?? []).filter(t => !isTripExpired(t.date, t.time));
    const driverIds = [...new Set(tripsData.map(t => t.driver_id))];

    const [{ data: profiles }, { data: vehicles }] = await Promise.all([
      driverIds.length
        ? supabase.from('profiles').select('id, first_name, last_name, average_rating, total_trips, verified').in('id', driverIds)
        : Promise.resolve({ data: [] as any[] }),
      driverIds.length
        ? supabase.from('driver_profiles').select('user_id, color').in('user_id', driverIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
    const colorMap = new Map((vehicles ?? []).map(v => [v.user_id, v.color]));

    setTrips(tripsData.map(t => {
      const p = profileMap.get(t.driver_id);
      const summary = getSeatSummary(t.total_seats, t.available_seats);
      return {
        id: t.id,
        driverId: t.driver_id,
        driverName: p ? `${p.first_name} ${p.last_name}`.trim() || 'Chofer' : 'Chofer',
        driverRating: p?.average_rating ?? 0,
        driverTotalTrips: p?.total_trips ?? 0,
        driverVerified: p?.verified ?? false,
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
        vehicleColor: colorMap.get(t.driver_id) ?? null,
        tripType: t.meeting_point ? 'with_stops' : 'direct',
      };
    }));
    setLoading(false);
  }, []);

  const checkUnread = useCallback(async () => {
    if (!user) return;
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString();
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .gte('created_at', since);
    setHasUnread((count ?? 0) > 0);
  }, [user]);

  useEffect(() => { void loadData(); void checkUnread(); }, [loadData, checkUnread]);

  useRealtimeRefresh({
    enabled: true,
    tables: ['trips'],
    onChange: loadData,
    channelName: 'home-recommended-refresh',
  });

  return (
    <div className="min-h-screen pb-24 bg-background">
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 text-foreground active:opacity-70"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={weegoLogo} alt="WEEGO" className="h-7 w-7 object-contain" />
            <span className="font-heading font-bold text-lg tracking-tight">
              WEE<span className="text-primary">GO</span>
            </span>
          </div>
          <button
            aria-label="Notificaciones"
            onClick={() => navigate('/notifications')}
            className="p-2 -mr-2 relative text-foreground active:opacity-70"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            )}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 space-y-6">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl overflow-hidden border border-border shadow-sm"
        >
          <img
            src={heroCarpool}
            alt="Personas viajando juntas"
            className="absolute inset-0 w-full h-full object-cover"
            width={1280}
            height={832}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/70 to-transparent" />
          <div className="relative p-5 pt-6 pb-6 max-w-[60%]">
            <h1 className="font-heading font-bold text-2xl leading-tight text-foreground">
              Compartí viajes.
            </h1>
            <p className="font-heading font-bold text-2xl leading-tight text-primary">
              Ahorrá plata.
            </p>
            <p className="text-xs text-muted-foreground mt-2 leading-snug">
              Encontrá o publicá viajes en segundos
            </p>
            <button
              onClick={() => navigate('/search')}
              className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-4 py-2.5 rounded-full shadow-md active:scale-95 transition-transform"
            >
              <Search className="h-4 w-4" />
              Buscar viaje
            </button>
          </div>
        </motion.section>

        {/* Intent cards */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => navigate('/publish')}
              className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 text-left shadow-sm active:scale-[0.97] transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-bold leading-tight">Soy chofer</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Publicá tu viaje</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate('/need-ride')}
              className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 text-left shadow-sm active:scale-[0.97] transition-transform"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserRound className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-bold leading-tight">Soy pasajero</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Buscá un viaje</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.button>
          </div>
        </section>

        {/* Recommended trips */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-heading font-bold">Viajes recomendados</h2>
            <button
              onClick={() => navigate('/search')}
              className="text-primary text-sm font-semibold active:opacity-70"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground text-sm py-8">Cargando...</p>
            ) : trips.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl py-10 px-6 text-center">
                <Rocket className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-heading font-bold text-sm">Todavía no hay viajes</p>
                <p className="text-xs text-muted-foreground mt-1">Sé el primero en publicar uno</p>
                <button
                  onClick={() => navigate('/publish')}
                  className="mt-4 inline-flex bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full active:scale-95 transition-transform"
                >
                  Publicar viaje
                </button>
              </div>
            ) : (
              trips.map((trip, i) => (
                <RecommendedTripCard
                  key={trip.id}
                  trip={trip}
                  index={i}
                  vehicleColor={trip.vehicleColor ?? undefined}
                  tripType={trip.tripType}
                />
              ))
            )}
          </div>
        </section>

        {/* Community banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3 overflow-hidden"
        >
          <div className="flex-1 min-w-0 z-10">
            <p className="text-base font-heading font-bold leading-tight text-foreground">
              Compartí gastos, viajá mejor
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sumate a la comunidad WEEGO
            </p>
            <button
              onClick={() => navigate('/search')}
              className="mt-3 inline-flex bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              Conocé más
            </button>
          </div>
          <img
            src={illustrationCarpool}
            alt=""
            className="h-24 w-auto object-contain shrink-0"
            width={768}
            height={512}
            loading="lazy"
          />
        </motion.div>
      </main>

      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="fixed bottom-24 right-4 z-40 bg-primary text-primary-foreground shadow-lg rounded-full h-12 w-12 flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Panel admin"
        >
          <ShieldCheck className="h-5 w-5" />
        </button>
      )}

      <BottomNav role="passenger" />
    </div>
  );
};

export default Index;
