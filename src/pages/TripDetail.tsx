import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, Star, MessageCircle, BadgeCheck, Car, Send, CheckCircle2, CreditCard, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { mockTrips, mockReviews } from '@/data/mockData';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

type BookingStep = 'none' | 'pending' | 'accepted' | 'rejected' | 'paid';

const stepConfig: Record<BookingStep, { label: string; desc: string; icon: typeof Send; color: string }> = {
  none: { label: 'Solicitar reserva', desc: 'Enviá tu solicitud al chofer.', icon: Send, color: 'text-muted-foreground' },
  pending: { label: 'Solicitud enviada', desc: 'Esperando que el chofer acepte tu solicitud...', icon: Clock, color: 'text-ocean-light' },
  accepted: { label: 'Chofer aceptó', desc: '¡Genial! Ahora podés pagar tu asiento.', icon: CheckCircle2, color: 'text-accent' },
  rejected: { label: 'Solicitud rechazada', desc: 'El chofer no aceptó. Probá con otro viaje.', icon: XCircle, color: 'text-destructive' },
  paid: { label: 'Pago confirmado', desc: 'Ya podés coordinar con el chofer por chat.', icon: CreditCard, color: 'text-primary' },
};

const flowSteps = [
  { key: 'none', label: 'Solicitar' },
  { key: 'pending', label: 'Esperar' },
  { key: 'accepted', label: 'Pagar' },
  { key: 'paid', label: 'Chat' },
];

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = mockTrips.find(t => t.id === id);
  const [bookingStatus, setBookingStatus] = useState<BookingStep>('none');

  if (!trip) return <div className="p-8 text-center text-muted-foreground">Viaje no encontrado</div>;

  const currentStepIndex = flowSteps.findIndex(s => s.key === bookingStatus);

  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Detalle del viaje</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-1 space-y-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          {/* Route card */}
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex flex-col items-center mt-1">
                <div className="w-3 h-3 rounded-full bg-accent border-2 border-accent/30" />
                <div className="w-0.5 h-12 bg-gradient-to-b from-accent/50 to-primary/50" />
                <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{trip.origin}</p>
                <p className="font-semibold text-sm mt-8">{trip.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-heading font-bold text-primary">${trip.pricePerSeat.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">por asiento</p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{trip.date} · {trip.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span className="font-medium">{trip.availableSeats}/{trip.totalSeats} lugares</span>
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
                  <PawPrint className="h-3 w-3" /> Viaja con mascota
                </Badge>
              )}
              {trip.allowsLuggage && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                  <Luggage className="h-3 w-3" /> Equipaje grande
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Driver card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-xl shrink-0">
                {trip.driverName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold font-heading">{trip.driverName}</span>
                  {trip.driverVerified && <BadgeCheck className="h-4.5 w-4.5 text-accent" />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <StarRating rating={trip.driverRating} size="sm" />
                    <span className="text-sm font-bold">{trip.driverRating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Car className="h-3.5 w-3.5" />
                    <span className="text-xs">{trip.driverTotalTrips} viajes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="space-y-2">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider">Reseñas</h3>
              {mockReviews.slice(0, 3).map(r => (
                <div key={r.id} className="bg-secondary/60 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground text-[10px] font-bold">
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
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-4">Estado de tu reserva</h3>

            {/* Progress bar */}
            <div className="flex items-center gap-1 mb-4">
              {flowSteps.map((step, i) => (
                <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full h-1.5 rounded-full transition-colors ${i <= currentStepIndex ? 'gradient-accent' : 'bg-muted'}`} />
                  <span className={`text-[9px] font-medium ${i <= currentStepIndex ? 'text-primary' : 'text-muted-foreground/50'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Current status */}
            {bookingStatus !== 'none' && (
              <div className={`flex items-center gap-3 p-3 rounded-xl bg-secondary/60 mb-4`}>
                {(() => {
                  const cfg = stepConfig[bookingStatus];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <Icon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                      <div>
                        <p className="text-sm font-semibold">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {bookingStatus === 'none' && (
                <Button
                  onClick={() => { setBookingStatus('pending'); toast.success('Solicitud enviada al chofer'); }}
                  className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                >
                  <Send className="h-4 w-4" /> Solicitar reserva
                </Button>
              )}
              {bookingStatus === 'pending' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-2 h-2 rounded-full bg-ocean-light animate-pulse" />
                    <span className="text-sm text-muted-foreground">Esperando respuesta del chofer...</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => { setBookingStatus('accepted'); toast.success('¡El chofer aceptó tu solicitud!'); }}
                      variant="outline"
                      className="text-xs h-10 rounded-xl gap-1"
                    >
                      <CheckCircle2 className="h-3 w-3 text-accent" /> Simular: Acepta
                    </Button>
                    <Button
                      onClick={() => { setBookingStatus('rejected'); toast.error('El chofer rechazó tu solicitud'); }}
                      variant="outline"
                      className="text-xs h-10 rounded-xl gap-1"
                    >
                      <XCircle className="h-3 w-3 text-destructive" /> Simular: Rechaza
                    </Button>
                  </div>
                </div>
              )}
              {bookingStatus === 'accepted' && (
                <Button
                  onClick={() => { setBookingStatus('paid'); toast.success('¡Pago realizado con éxito!'); }}
                  className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                >
                  <CreditCard className="h-4 w-4" /> Pagar con Mercado Pago
                </Button>
              )}
              {bookingStatus === 'rejected' && (
                <Button
                  onClick={() => navigate('/search')}
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2 text-sm"
                >
                  Buscar otro viaje
                </Button>
              )}
              {bookingStatus === 'paid' && (
                <Button
                  onClick={() => toast.info('Chat disponible próximamente')}
                  className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                >
                  <MessageCircle className="h-4 w-4" /> Chatear con el chofer
                </Button>
              )}
            </div>

            {/* Flow hint */}
            {bookingStatus === 'none' && (
              <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
                El pago se habilita solo cuando el chofer acepta. El chat se activa después de pagar.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default TripDetail;
