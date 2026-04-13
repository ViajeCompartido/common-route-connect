import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Car, Search, Hand, ArrowRight } from 'lucide-react';
import SearchForm from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import BottomNav from '@/components/BottomNav';
import HowItWorks from '@/components/HowItWorks';
import FeatureBlocks from '@/components/FeatureBlocks';
import VerifiedDrivers from '@/components/VerifiedDrivers';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trip } from '@/types';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .eq('status', 'active')
      .gt('available_seats', 0)
      .order('date', { ascending: true })
      .limit(3);

    if (!data || data.length === 0) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const driverIds = [...new Set(data.map(t => t.driver_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, average_rating, total_trips, verified')
      .in('id', driverIds);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

    setTrips(data.map(t => {
      const p = profileMap.get(t.driver_id);
      return {
        id: t.id, driverId: t.driver_id,
        driverName: p ? `${p.first_name} ${p.last_name}`.trim() || 'Chofer' : 'Chofer',
        driverRating: p?.average_rating ?? 0,
        driverTotalTrips: p?.total_trips ?? 0,
        driverVerified: p?.verified ?? false,
        origin: t.origin, destination: t.destination,
        zone: t.zone, meetingPoint: t.meeting_point,
        date: t.date, time: t.time,
        availableSeats: t.available_seats, totalSeats: t.total_seats,
        pricePerSeat: Number(t.price_per_seat),
        acceptsPets: t.accepts_pets, hasPet: t.has_pet,
        allowsLuggage: t.allows_luggage,
        observations: t.observations, status: t.status,
      };
    }));
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="gradient-ocean px-4 pt-10 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Car className="h-7 w-7 text-accent" />
            <h1 className="text-xl font-heading font-bold text-primary-foreground tracking-tight">ViajeCompartido</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm mb-6 max-w-[320px]">
            Encontrá choferes y pasajeros compatibles con tu ruta, zona y horario. Viajá seguro, compartí gastos.
          </p>
          <div className="bg-card rounded-2xl p-5 shadow-ocean">
            <SearchForm compact onSearch={() => navigate('/search')} />
          </div>
        </motion.div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Bidirectional CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <button onClick={() => navigate('/need-ride')} className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform">
              <Hand className="h-6 w-6 text-accent mb-2" />
              <p className="text-sm font-heading font-bold">Necesito viajar</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Publicá tu necesidad y encontrá choferes compatibles.</p>
              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 mt-2">Publicar <ArrowRight className="h-3 w-3" /></span>
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <button onClick={() => navigate('/publish')} className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform">
              <Car className="h-6 w-6 text-primary mb-2" />
              <p className="text-sm font-heading font-bold">Soy chofer</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Publicá tu viaje y encontrá pasajeros que buscan tu ruta.</p>
              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 mt-2">Publicar <ArrowRight className="h-3 w-3" /></span>
            </button>
          </motion.div>
        </div>

        <HowItWorks />
        <FeatureBlocks />
        <VerifiedDrivers />

        {/* Upcoming trips */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-heading font-bold">Viajes disponibles</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/search')} className="text-primary gap-1 text-xs h-8">
              Ver todos <Search className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Viajes que salen próximamente.</p>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground text-sm py-8">Cargando viajes...</p>
            ) : trips.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No hay viajes publicados todavía.</p>
            ) : trips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} />
            ))}
          </div>
        </div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default Index;
