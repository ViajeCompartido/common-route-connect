import { MapPin, Clock, Users, PawPrint, Luggage, Star, BadgeCheck, Car } from 'lucide-react';
import { Trip } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface TripCardProps {
  trip: Trip;
  index?: number;
}

const TripCard = ({ trip, index = 0 }: TripCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
    >
      <button
        className="w-full text-left bg-card rounded-xl p-4 border border-border hover:shadow-ocean transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring"
        onClick={() => navigate(`/trip/${trip.id}`)}
      >
        {/* Driver header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading text-sm font-bold shrink-0">
              {trip.driverName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold font-heading leading-tight">{trip.driverName}</span>
                {trip.driverVerified && (
                  <BadgeCheck className="h-4 w-4 text-accent shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-accent text-accent" />
                  <span className="text-xs font-semibold">{trip.driverRating}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">·</span>
                <div className="flex items-center gap-0.5">
                  <Car className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{trip.driverTotalTrips} viajes</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold font-heading text-primary leading-tight">${trip.pricePerSeat.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">por asiento</p>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-start gap-3 mb-3 pl-1">
          <div className="flex flex-col items-center mt-1">
            <div className="w-2.5 h-2.5 rounded-full bg-accent border-2 border-accent/30" />
            <div className="w-0.5 h-7 bg-gradient-to-b from-accent/50 to-primary/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary/30" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{trip.origin}</p>
            <p className="text-sm font-medium mt-4 truncate">{trip.destination}</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 mb-3 text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{trip.date} · {trip.time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {trip.availableSeats} {trip.availableSeats === 1 ? 'lugar' : 'lugares'}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {trip.acceptsPets && (
            <Badge variant="secondary" className="text-[10px] px-2 py-1 gap-1 rounded-full">
              <PawPrint className="h-3 w-3" /> Acepta mascotas
            </Badge>
          )}
          {trip.hasPet && (
            <Badge variant="secondary" className="text-[10px] px-2 py-1 gap-1 rounded-full bg-accent/10 text-accent border-accent/20">
              <PawPrint className="h-3 w-3" /> Viaja con mascota
            </Badge>
          )}
          {trip.allowsLuggage && (
            <Badge variant="secondary" className="text-[10px] px-2 py-1 gap-1 rounded-full">
              <Luggage className="h-3 w-3" /> Equipaje
            </Badge>
          )}
        </div>
      </button>
    </motion.div>
  );
};

export default TripCard;
