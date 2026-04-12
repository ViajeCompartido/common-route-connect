import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, BadgeCheck, Star, MessageCircle, CheckCircle2, XCircle, Car, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { mockRideRequests } from '@/data/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const DriverRequests = () => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const handleAccept = (id: string) => {
    setStatuses({ ...statuses, [id]: 'accepted' });
    toast.success('¡Solicitud aceptada! Se abre el chat de coordinación.');
  };

  const handleReject = (id: string) => {
    setStatuses({ ...statuses, [id]: 'rejected' });
    toast('Solicitud rechazada.');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Solicitudes recibidas</h1>
          <p className="text-sm text-primary-foreground/70">Revisá las solicitudes y decidí si aceptás o rechazás.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {mockRideRequests.map((req, i) => {
          const status = statuses[req.id] || 'pending';
          return (
            <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-card rounded-2xl p-5 border border-border">
                {/* Passenger info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-lg shrink-0">
                    {req.passengerName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold font-heading text-sm">{req.passengerName}</span>
                      {req.passengerVerified && <BadgeCheck className="h-4 w-4 text-accent" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1">
                        <StarRating rating={req.passengerRating} size="sm" />
                        <span className="text-xs font-bold">{req.passengerRating}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Car className="h-3 w-3" /> {req.passengerTrips} viajes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trip details */}
                <div className="bg-secondary/60 rounded-xl p-3 mb-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>{req.origin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{req.destination}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.date} · {req.time}hs</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {req.seats} lugar{req.seats > 1 ? 'es' : ''}</span>
                  </div>
                  <div className="flex gap-2">
                    {req.hasPet && (
                      <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5">
                        <PawPrint className="h-3 w-3" /> Con mascota
                      </Badge>
                    )}
                    {req.hasLuggage && (
                      <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5">
                        <Luggage className="h-3 w-3" /> Equipaje grande
                      </Badge>
                    )}
                  </div>
                </div>

                {req.message && (
                  <p className="text-xs text-muted-foreground italic mb-3 px-1">"{req.message}"</p>
                )}

                {/* Actions */}
                {status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleAccept(req.id)} className="h-11 rounded-xl gap-1.5 text-sm gradient-accent text-primary-foreground">
                      <CheckCircle2 className="h-4 w-4" /> Aceptar
                    </Button>
                    <Button onClick={() => handleReject(req.id)} variant="outline" className="h-11 rounded-xl gap-1.5 text-sm text-destructive border-destructive/30">
                      <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                  </div>
                )}
                {status === 'accepted' && (
                  <div className="bg-accent/10 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-accent">Aceptado</p>
                      <p className="text-[10px] text-muted-foreground">Se abrió el chat de coordinación.</p>
                    </div>
                    <Button size="sm" className="h-8 rounded-lg gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate('/chat/1?phase=coordination')}>
                      <MessageCircle className="h-3 w-3" /> Chat
                    </Button>
                  </div>
                )}
                {status === 'rejected' && (
                  <div className="bg-destructive/10 rounded-xl p-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-destructive font-medium">Rechazado</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default DriverRequests;
