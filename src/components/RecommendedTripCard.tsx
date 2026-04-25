import { Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trip } from '@/types';
import { formatPrice } from '@/lib/formatPrice';
import { formatTime } from '@/lib/formatTime';

interface RecommendedTripCardProps {
  trip: Trip;
  index?: number;
  vehicleColor?: string;
  tripType?: 'direct' | 'with_stops';
}

const formatRelativeDate = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const trip = new Date(dateStr + 'T00:00:00');
  if (trip.getTime() === today.getTime()) return 'Hoy';
  if (trip.getTime() === tomorrow.getTime()) return 'Mañana';
  return trip.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const RecommendedTripCard = ({ trip, index = 0, vehicleColor, tripType = 'direct' }: RecommendedTripCardProps) => {
  const navigate = useNavigate();
  const carColor = vehicleColor || 'hsl(var(--primary))';

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="w-full text-left bg-card border border-border rounded-2xl p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Route */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="flex flex-col items-center mt-1.5">
            <div className="w-2 h-2 rounded-full bg-foreground" />
            <div className="w-px h-5 bg-border my-0.5" />
            <div className="w-2.5 h-2.5 rounded-full border-2 border-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{trip.origin}</p>
            <p className="text-sm font-semibold mt-2 truncate">{trip.destination}</p>
          </div>
        </div>
        {/* Date & seats */}
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{formatRelativeDate(trip.date)}, {formatTime(trip.time)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {trip.availableSeats} {trip.availableSeats === 1 ? 'lugar' : 'lugares'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-lg font-heading font-bold text-primary">{formatPrice(trip.pricePerSeat)}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {tripType === 'direct' ? 'Directo' : 'Con paradas'}
          </span>
        </div>
        <Car className="h-5 w-5" style={{ color: carColor }} fill={carColor} fillOpacity={0.2} />
      </div>
    </motion.button>
  );
};

export default RecommendedTripCard;
