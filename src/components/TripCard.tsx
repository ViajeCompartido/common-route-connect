import { MapPin, Clock, Users, PawPrint, Luggage, Star, BadgeCheck, Car, ChevronRight, Hand } from 'lucide-react';
import { Trip } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getInitial } from '@/lib/avatarUtils';
import { formatPrice } from '@/lib/formatPrice';
import { formatTime } from '@/lib/formatTime';

interface TripCardProps {
  trip: Trip;
  index?: number;
  type?: 'driver' | 'passenger';
  viewerIsDriver?: boolean;
  viewerUserId?: string;
}

const TripCard = ({ trip, index = 0, type = 'driver', viewerIsDriver = false, viewerUserId }: TripCardProps) => {
  const navigate = useNavigate();
  const isPassengerRequest = type === 'passenger';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07, duration: 0.35 }}>
      <div className={`bg-card rounded-2xl border overflow-hidden ${isPassengerRequest ? 'border-accent/30' : 'border-border'}`}>
        {/* Type indicator */}
        <div className={`px-4 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${isPassengerRequest ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
          {isPassengerRequest ? <Hand className="h-3 w-3" /> : <Car className="h-3 w-3" />}
          {isPassengerRequest ? 'Pasajero busca viaje' : 'Chofer ofrece viaje'}
        </div>

        <button className="w-full text-left p-4 active:bg-muted/30 transition-colors focus:outline-none" onClick={() => isPassengerRequest ? null : navigate(`/trip/${trip.id}`)}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center font-heading text-sm font-bold shrink-0 ${isPassengerRequest ? 'bg-accent/20 text-accent' : 'gradient-ocean text-primary-foreground'}`}>
                {getInitial(trip.driverName)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold font-heading leading-tight">{trip.driverName}</span>
                  {trip.driverVerified && <BadgeCheck className="h-4 w-4 text-accent shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    <span className="text-xs font-semibold">{trip.driverRating}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">· {trip.driverTotalTrips} viajes</span>
                </div>
              </div>
            </div>
            {!isPassengerRequest && (
              <div className="text-right">
                <p className="text-lg font-bold font-heading text-primary leading-tight">{formatPrice(trip.pricePerSeat)}</p>
                <p className="text-[10px] text-muted-foreground">por asiento</p>
              </div>
            )}
          </div>

          {/* Route */}
          <div className="flex items-start gap-3 mb-3 pl-1">
            <div className="flex flex-col items-center mt-1">
              <div className={`w-2.5 h-2.5 rounded-full border-2 ${isPassengerRequest ? 'bg-accent border-accent/30' : 'bg-accent border-accent/30'}`} />
              <div className={`w-0.5 h-7 ${isPassengerRequest ? 'bg-gradient-to-b from-accent/50 to-accent/20' : 'bg-gradient-to-b from-accent/50 to-primary/50'}`} />
              <div className={`w-2.5 h-2.5 rounded-full border-2 ${isPassengerRequest ? 'bg-accent/60 border-accent/20' : 'bg-primary border-primary/30'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{trip.origin}</p>
              <p className="text-sm font-medium mt-4 truncate">{trip.destination}</p>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-3 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">{trip.date} · {formatTime(trip.time)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">
                {isPassengerRequest
                  ? `${trip.availableSeats} lugar${trip.availableSeats === 1 ? '' : 'es'}`
                  : `${trip.availableSeats} ${trip.availableSeats === 1 ? 'lugar' : 'lugares'}`
                }
              </span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {trip.acceptsPets && (
              <Badge variant="secondary" className="text-[10px] px-2 py-1 gap-1 rounded-full"><PawPrint className="h-3 w-3" /> Acepta mascotas</Badge>
            )}
            {trip.hasPet && (
              <Badge variant="secondary" className="text-[10px] px-2 py-1 gap-1 rounded-full bg-accent/10 text-accent border-accent/20"><PawPrint className="h-3 w-3" /> Viaja con mascota</Badge>
            )}
            {trip.allowsLuggage && (
              <Badge variant="secondary" className="text-[10px] px-2 py-1 gap-1 rounded-full"><Luggage className="h-3 w-3" /> Equipaje</Badge>
            )}
          </div>
        </button>

        {/* CTA footer */}
        <div className="px-4 pb-3 pt-0">
          {isPassengerRequest ? (
            // Only show "Ofrecerme como chofer" if viewer is a driver and it's not their own post
            viewerIsDriver && viewerUserId !== trip.driverId ? (
              <Button
                onClick={() => navigate('/compatible-passengers')}
                className="w-full h-11 rounded-xl text-sm font-semibold gap-1.5 bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30"
                variant="outline"
              >
                <Car className="h-4 w-4" /> Ofrecerme como chofer
              </Button>
            ) : viewerUserId === trip.driverId ? (
              <p className="text-xs text-muted-foreground text-center py-2">Tu publicación</p>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">Solo choferes pueden ofrecerse</p>
            )
          ) : (
            viewerUserId !== trip.driverId ? (
              <Button
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="w-full h-11 rounded-xl text-sm font-semibold gap-1.5 gradient-accent text-primary-foreground"
              >
                Reservá tu lugar <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">Tu publicación</p>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TripCard;
