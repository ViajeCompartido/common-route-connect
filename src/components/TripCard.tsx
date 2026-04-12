import { MapPin, Clock, Users, PawPrint, Luggage, Star } from 'lucide-react';
import { Trip } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card
        className="p-4 cursor-pointer hover:shadow-ocean transition-shadow border border-border"
        onClick={() => navigate(`/trip/${trip.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading text-sm font-semibold">
              {trip.driverName.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold font-heading">{trip.driverName}</p>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" />
                <span className="text-xs text-muted-foreground">{trip.driverRating}</span>
              </div>
            </div>
          </div>
          <p className="text-lg font-bold font-heading text-primary">${trip.pricePerSeat.toLocaleString()}</p>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="w-0.5 h-6 bg-border" />
            <MapPin className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{trip.origin}</p>
            <p className="text-sm font-medium mt-3">{trip.destination}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs">{trip.date} · {trip.time}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">{trip.availableSeats} lugares</span>
          </div>
        </div>

        <div className="flex gap-1.5 mt-3">
          {trip.acceptsPets && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1">
              <PawPrint className="h-3 w-3" /> Mascotas OK
            </Badge>
          )}
          {trip.hasPet && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1">
              <PawPrint className="h-3 w-3" /> Viaja con mascota
            </Badge>
          )}
          {trip.allowsLuggage && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1">
              <Luggage className="h-3 w-3" /> Equipaje
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default TripCard;
