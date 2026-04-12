import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, Star, MessageCircle, BadgeCheck, Car, Send, CheckCircle2, CreditCard, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { mockTrips, mockReviews } from '@/data/mockData';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

type BookingStep = 'none' | 'pending' | 'accepted' | 'rejected' | 'paid';

const flowSteps = [
  { key: 'none', label: 'Solicitar', icon: Send },
  { key: 'pending', label: 'Esperar', icon: Clock },
  { key: 'accepted', label: 'Pagar', icon: CreditCard },
  { key: 'paid', label: 'Chat', icon: MessageCircle },
];

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = mockTrips.find(t => t.id === id);
  const [bookingStatus, setBookingStatus] = useState<BookingStep>('none');

  if (!trip) return <div className="p-8 text-center text-muted-foreground">No encontramos este viaje.</div>;

  const currentStepIndex = flowSteps.findIndex(s => s.key === bookingStatus);

  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Detalle del viaje</h1>
          <p className="text-xs text-primary-foreground/60 mt-0.5">Revisá la info y pedí tu lugar.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-1 space-y-3">
        {/* Route card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex flex-col items-center mt-1">
                <div className="w-3 h-3 rounded-full bg-accent border-2 border-accent/30" />
                <div className="w-0.5 h-12 bg-gradient-to-b from-accent/50 to-primary/50" />
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Sale de</p>
                <p className="font-semibold text-sm">{trip.origin}</p>
                <p className="text-xs text-muted-foreground mt-5">Llega a</p>
                <p className="font-semibold text-sm">{trip.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-heading font-bold text-primary">${trip.pricePerSeat.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">por asiento</p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{trip.date} · {trip.time}hs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="font-medium">{trip.availableSeats} de {trip.totalSeats} lugares libres</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap pt-2">
              {trip.acceptsPets && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                  <PawPrint className="h-3 w-3" /> Acepta mascotas
                </Badge>
              )}
              {trip.hasPet && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1 bg-accent/10 text-accent">
                  <PawPrint className="h-3 w-3" /> El chofer viaja con mascota
                </Badge>
              )}
              {trip.allowsLuggage && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                  <Luggage className="h-3 w-3" /> Equipaje grande OK
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Driver card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">Sobre el chofer</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-xl shrink-0">
                {trip.driverName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold font-heading">{trip.driverName}</span>
                  {trip.driverVerified && <BadgeCheck className="h-5 w-5 text-accent" />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <StarRating rating={trip.driverRating} size="sm" />
                    <span className="text-sm font-bold">{trip.driverRating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Car className="h-3.5 w-3.5" />
                    <span className="text-xs">{trip.driverTotalTrips} viajes realizados</span>
                  </div>
                </div>
                {trip.driverVerified && (
                  <p className="text-[10px] text-accent mt-1 font-medium">✓ Identidad y vehículo verificados</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-heading font-bold text-muted-foreground">Qué dicen los pasajeros</h4>
              {mockReviews.slice(0, 3).map(r => (
                <div key={r.id} className="bg-secondary/60 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                      {r.fromUserName.charAt(0)}
                    </div>
                    <span className="text-xs font-medium flex-1">{r.fromUserName}</span>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground pl-8">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Booking flow */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-4">Tu reserva</h3>

            {/* Step progress */}
            <div className="flex items-center gap-1 mb-5">
              {flowSteps.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i <= currentStepIndex;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'gradient-accent text-primary-foreground' : 'bg-muted text-muted-foreground/40'}`}>
                      <StepIcon className="h-3.5 w-3.5" />
                    </div>
                    <span className={`text-[9px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>
                      {step.label}
                    </span>
                    {i < flowSteps.length - 1 && (
                      <div className={`absolute h-0.5 w-full ${isActive ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status messages */}
            {bookingStatus === 'none' && (
              <div className="bg-secondary/60 rounded-xl p-3 mb-4 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">¿Cómo funciona?</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                    1. Mandás tu solicitud → 2. El chofer acepta o rechaza → 3. Si acepta, pagás → 4. Se abre el chat para coordinar.
                  </p>
                </div>
              </div>
            )}

            {bookingStatus === 'pending' && (
              <div className="bg-ocean-light/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-ocean-light animate-pulse shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Solicitud enviada</p>
                  <p className="text-[11px] text-muted-foreground">El chofer va a revisar tu perfil y decidir. Te avisamos cuando responda.</p>
                </div>
              </div>
            )}

            {bookingStatus === 'accepted' && (
              <div className="bg-accent/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-accent">¡Te aceptaron!</p>
                  <p className="text-[11px] text-muted-foreground">Ahora podés pagar tu asiento. Recién después se habilita el chat con el chofer.</p>
                </div>
              </div>
            )}

            {bookingStatus === 'rejected' && (
              <div className="bg-destructive/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <XCircle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-destructive">El chofer no aceptó</p>
                  <p className="text-[11px] text-muted-foreground">No te preocupes, hay muchos viajes disponibles. Buscá otro que te sirva.</p>
                </div>
              </div>
            )}

            {bookingStatus === 'paid' && (
              <div className="bg-primary/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                <MessageCircle className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary">¡Todo listo!</p>
                  <p className="text-[11px] text-muted-foreground">Pago confirmado. Ya podés chatear con el chofer para coordinar punto de encuentro, horario exacto y cualquier detalle.</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              {bookingStatus === 'none' && (
                <Button
                  onClick={() => { setBookingStatus('pending'); toast.success('¡Solicitud enviada! El chofer te va a responder pronto.'); }}
                  className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                >
                  <Send className="h-4 w-4" /> Pedir mi lugar
                </Button>
              )}
              {bookingStatus === 'pending' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => { setBookingStatus('accepted'); toast.success('¡El chofer aceptó tu solicitud!'); }}
                    variant="outline"
                    className="text-xs h-11 rounded-xl gap-1 border-accent/30 text-accent"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Simular: Acepta
                  </Button>
                  <Button
                    onClick={() => { setBookingStatus('rejected'); toast.error('El chofer rechazó la solicitud.'); }}
                    variant="outline"
                    className="text-xs h-11 rounded-xl gap-1 border-destructive/30 text-destructive"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Simular: Rechaza
                  </Button>
                </div>
              )}
              {bookingStatus === 'accepted' && (
                <Button
                  onClick={() => { setBookingStatus('paid'); toast.success('¡Pago confirmado! Ya podés chatear con el chofer.'); }}
                  className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                >
                  <CreditCard className="h-4 w-4" /> Pagar con Mercado Pago — ${trip.pricePerSeat.toLocaleString()}
                </Button>
              )}
              {bookingStatus === 'rejected' && (
                <Button onClick={() => navigate('/search')} variant="outline" className="w-full h-12 rounded-xl gap-2 text-sm">
                  Buscar otro viaje
                </Button>
              )}
              {bookingStatus === 'paid' && (
                <Button
                  onClick={() => navigate(`/chat/${trip.id}`)}
                  className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                >
                  <MessageCircle className="h-4 w-4" /> Abrir chat con {trip.driverName.split(' ')[0]}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default TripDetail;
