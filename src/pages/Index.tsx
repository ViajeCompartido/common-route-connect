import { motion } from 'framer-motion';
import { Car, Search, Hand, ArrowRight } from 'lucide-react';
import SearchForm from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import BottomNav from '@/components/BottomNav';
import HowItWorks from '@/components/HowItWorks';
import FeatureBlocks from '@/components/FeatureBlocks';
import VerifiedDrivers from '@/components/VerifiedDrivers';
import { mockTrips } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="gradient-ocean px-4 pt-10 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
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
            <button
              onClick={() => navigate('/need-ride')}
              className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
            >
              <Hand className="h-6 w-6 text-accent mb-2" />
              <p className="text-sm font-heading font-bold">Necesito viajar</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Publicá tu necesidad y encontrá choferes compatibles.</p>
              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 mt-2">
                Publicar <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <button
              onClick={() => navigate('/publish')}
              className="w-full bg-card border border-border rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
            >
              <Car className="h-6 w-6 text-primary mb-2" />
              <p className="text-sm font-heading font-bold">Soy chofer</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Publicá tu viaje y encontrá pasajeros que buscan tu ruta.</p>
              <span className="text-[10px] text-primary font-medium flex items-center gap-0.5 mt-2">
                Publicar <ArrowRight className="h-3 w-3" />
              </span>
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
            {mockTrips.slice(0, 3).map((trip, i) => (
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
