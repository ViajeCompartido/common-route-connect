import { motion } from 'framer-motion';
import { Car, Shield, Star } from 'lucide-react';
import SearchForm from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import BottomNav from '@/components/BottomNav';
import { mockTrips } from '@/data/mockData';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <div className="gradient-ocean px-4 pt-12 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto"
        >
          <div className="flex items-center gap-2 mb-1">
            <Car className="h-6 w-6 text-accent" />
            <h1 className="text-xl font-heading font-bold text-primary-foreground">ViajeCompartido</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm mb-6">
            Viajá entre ciudades, compartí gastos y conocé gente.
          </p>

          <div className="bg-card rounded-xl p-4 shadow-ocean">
            <SearchForm compact onSearch={() => navigate('/search')} />
          </div>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Shield, label: 'Viajes\nseguros', color: 'text-primary' },
            { icon: Star, label: 'Choferes\nverificados', color: 'text-accent' },
            { icon: Car, label: 'Precios\njustos', color: 'text-ocean-light' },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex flex-col items-center text-center gap-2 p-3 rounded-xl bg-secondary"
            >
              <f.icon className={`h-6 w-6 ${f.color}`} />
              <span className="text-xs font-medium whitespace-pre-line">{f.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Upcoming trips */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold">Próximos viajes</h2>
          <button
            onClick={() => navigate('/search')}
            className="text-sm text-primary font-medium"
          >
            Ver todos
          </button>
        </div>

        <div className="space-y-3">
          {mockTrips.slice(0, 3).map((trip, i) => (
            <TripCard key={trip.id} trip={trip} index={i} />
          ))}
        </div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default Index;
