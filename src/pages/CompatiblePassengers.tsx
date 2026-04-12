import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, BadgeCheck, Star, Sparkles, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { mockRideRequests } from '@/data/mockData';
import { motion } from 'framer-motion';

const CompatiblePassengers = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Pasajeros compatibles</h1>
          <p className="text-sm text-primary-foreground/70">Personas que buscan viajar en rutas y horarios parecidos a los tuyos.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <div className="bg-accent/10 rounded-2xl p-3 flex items-start gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">
            Estos pasajeros coinciden con tus viajes publicados en zona, destino y horario aproximado.
          </p>
        </div>

        {mockRideRequests.map((req, i) => (
          <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold shrink-0">
                  {req.passengerName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold font-heading text-sm">{req.passengerName}</span>
                    {req.passengerVerified && <BadgeCheck className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={req.passengerRating} size="sm" />
                    <span className="text-xs font-bold">{req.passengerRating}</span>
                    <span className="text-[10px] text-muted-foreground">· {req.passengerTrips} viajes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>{req.origin} → {req.destination}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.date} · {req.time}hs</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {req.seats} lugar{req.seats > 1 ? 'es' : ''}</span>
                </div>
                <div className="flex gap-2">
                  {req.hasPet && (
                    <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5">
                      <PawPrint className="h-3 w-3" /> Mascota
                    </Badge>
                  )}
                  {req.hasLuggage && (
                    <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5">
                      <Luggage className="h-3 w-3" /> Equipaje
                    </Badge>
                  )}
                </div>
              </div>

              {req.message && (
                <p className="text-xs text-muted-foreground italic mb-3">"{req.message}"</p>
              )}

              <Badge className="text-[10px] gap-1 rounded-full px-2.5 py-1 bg-accent/15 text-accent border-accent/30 mb-3">
                <Sparkles className="h-3 w-3" /> Coincidencia alta
              </Badge>

              <Button className="w-full h-11 rounded-xl gap-1.5 text-sm gradient-accent text-primary-foreground" onClick={() => navigate('/driver-requests')}>
                <Car className="h-4 w-4" /> Invitar a tu viaje
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default CompatiblePassengers;
