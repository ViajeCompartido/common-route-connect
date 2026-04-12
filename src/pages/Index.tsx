import { motion } from 'framer-motion';
import { Car, Search } from 'lucide-react';
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
          <p className="text-primary-foreground/70 text-sm mb-6 max-w-[280px]">
            Conectá con choferes reales que ya viajan entre ciudades. Compartí gastos, viajá seguro.
          </p>

          <div className="bg-card rounded-2xl p-5 shadow-ocean">
            <SearchForm compact onSearch={() => navigate('/search')} />
          </div>
        </motion.div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* How it works */}
        <HowItWorks />

        {/* Feature blocks */}
        <FeatureBlocks />

        {/* Verified drivers carousel */}
        <VerifiedDrivers />

        {/* Upcoming trips */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-heading font-bold">Próximos viajes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/search')}
              className="text-primary gap-1 text-xs h-8"
            >
              Ver todos <Search className="h-3 w-3" />
            </Button>
          </div>

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
