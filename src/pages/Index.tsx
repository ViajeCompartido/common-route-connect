import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Menu, ShieldCheck } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import RecommendedTripCard from '@/components/RecommendedTripCard';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { isTripExpired } from '@/lib/tripUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import weegoLogo from '@/assets/weego-logo.png';
import illustrationDriver from '@/assets/illustration-driver.png';
import illustrationPassenger from '@/assets/illustration-passenger.png';
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

  useEffect(() => { void loadData(); }, [loadData]);

  useRealtimeRefresh({
    enabled: true,
    tables: ['trips'],
    onChange: loadData,
    channelName: 'home-recommended-refresh',
  });

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            aria-label="Menú"
            onClick={() => navigate('/profile')}
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
            onClick={() => navigate('/my-trips')}
            className="p-2 -mr-2 relative text-foreground active:opacity-70"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-5 space-y-6">
        {/* Intent cards */}
        <section>
          <h1 className="text-lg font-heading font-bold mb-3">¿Qué querés hacer hoy?</h1>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => navigate('/publish')}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center active:scale-[0.98] transition-transform"
            >
              <img
                src={illustrationDriver}
                alt="Soy chofer"
                className="h-24 w-auto object-contain mb-2"
                width={512}
                height={512}
                loading="lazy"
              />
              <p className="text-base font-heading font-bold">Soy chofer</p>
              <p className="text-xs text-muted-foreground mt-0.5">Publicá tu viaje</p>
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate('/need-ride')}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center active:scale-[0.98] transition-transform"
            >
              <img
                src={illustrationPassenger}
                alt="Soy pasajero"
                className="h-24 w-auto object-contain mb-2"
                width={512}
                height={512}
                loading="lazy"
              />
              <p className="text-base font-heading font-bold">Soy pasajero</p>
              <p className="text-xs text-muted-foreground mt-0.5">Buscá un viaje</p>
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
              <p className="text-center text-muted-foreground text-sm py-8">
                No hay viajes publicados todavía.
              </p>
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
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/search')}
          className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-transform overflow-hidden"
        >
          <div className="flex-1 min-w-0">
            <p className="text-base font-heading font-bold leading-tight">
              Compartí gastos, viajá mejor
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sumate a la comunidad WEEGO
            </p>
          </div>
          <img
            src={illustrationCarpool}
            alt=""
            className="h-20 w-auto object-contain shrink-0"
            width={768}
            height={512}
            loading="lazy"
          />
        </motion.button>
      </main>

      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="fixed bottom-24 right-4 z-40 gradient-accent text-primary-foreground shadow-ocean rounded-full h-12 w-12 flex items-center justify-center active:scale-95 transition-transform"
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
