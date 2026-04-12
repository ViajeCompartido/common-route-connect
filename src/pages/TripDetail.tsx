import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, Star, MessageCircle, BadgeCheck, Car, Send, CheckCircle2, CreditCard, XCircle, Info, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type BookingStep = 'none' | 'pending' | 'accepted' | 'coordinating' | 'confirmed' | 'paid';

const flowSteps = [
  { key: 'none', label: 'Solicitar', icon: Send },
  { key: 'pending', label: 'Esperar', icon: Clock },
  { key: 'accepted', label: 'Coordinar', icon: MessageCircle },
  { key: 'confirmed', label: 'Pagar', icon: CreditCard },
  { key: 'paid', label: '¡Listo!', icon: CheckCircle2 },
];

interface TripData {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  available_seats: number;
  total_seats: number;
  price_per_seat: number;
  accepts_pets: boolean;
  has_pet: boolean;
  allows_luggage: boolean;
  zone: string | null;
  meeting_point: string | null;
  observations: string | null;
  driver_id: string;
  status: string;
}

interface DriverProfile {
  first_name: string;
  last_name: string;
  average_rating: number;
  total_trips: number;
  verified: boolean;
}

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [bookingStatus, setBookingStatus] = useState<BookingStep>('none');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTrip();
  }, [id]);

  const loadTrip = async () => {
    setLoading(true);
    const { data: tripData, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tripData) {
      setLoading(false);
      return;
    }
    setTrip(tripData);

    // Load driver profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('first_name, last_name, average_rating, total_trips, verified')
      .eq('id', tripData.driver_id)
      .single();
    if (profileData) setDriver(profileData);

    // Check if user already has a booking for this trip
    if (user) {
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('trip_id', id)
        .eq('passenger_id', user.id)
        .not('status', 'in', '("cancelled_passenger","cancelled_driver","rejected")')
        .maybeSingle();

      if (existingBooking) {
        setBookingId(existingBooking.id);
        const statusMap: Record<string, BookingStep> = {
          pending: 'pending',
          accepted: 'accepted',
          coordinating: 'coordinating',
          paid: 'paid',
          completed: 'paid',
        };
        setBookingStatus(statusMap[existingBooking.status] || 'none');
      }
    }
    setLoading(false);
  };

  const handleRequestSeat = async () => {
    if (!user || !trip) return;
    setSubmitting(true);

    const { data, error } = await supabase.from('bookings').insert({
      trip_id: trip.id,
      passenger_id: user.id,
      driver_id: trip.driver_id,
      seats: 1,
      price_per_seat: trip.price_per_seat,
      status: 'pending',
    }).select('id').single();

    setSubmitting(false);
    if (error) {
      toast.error('No pudimos enviar la solicitud. Intentá de nuevo.');
      console.error(error);
      return;
    }
    setBookingId(data.id);
    setBookingStatus('pending');
    toast.success('¡Solicitud enviada!');
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    await supabase.from('bookings').update({ status: 'cancelled_passenger' }).eq('id', bookingId);
    setBookingStatus('none');
    setBookingId(null);
    setRejected(false);
    toast('Solicitud cancelada.');
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando viaje...</p>
      </div>
    );
  }

  if (!trip) return <div className="p-8 text-center text-muted-foreground">No encontramos este viaje.</div>;

  const driverName = driver ? `${driver.first_name} ${driver.last_name}`.trim() : 'Chofer';
  const currentStepIndex = flowSteps.findIndex(s => s.key === bookingStatus);

  return (
    <div className="min-h-screen pb-24">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Detalle del viaje</h1>
          <p className="text-xs text-primary-foreground/60 mt-0.5">Revisá la info y reservá tu lugar.</p>
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
                {trip.meeting_point && (
                  <p className="text-[10px] text-accent mt-0.5">📍 {trip.meeting_point}</p>
                )}
                <p className="text-xs text-muted-foreground mt-5">Llega a</p>
                <p className="font-semibold text-sm">{trip.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-heading font-bold text-primary">${Number(trip.price_per_seat).toLocaleString()}</p>
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
                <span className="font-medium">{trip.available_seats} de {trip.total_seats} lugares libres</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap pt-2">
              {trip.accepts_pets && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                  <PawPrint className="h-3 w-3" /> Acepta mascotas
                </Badge>
              )}
              {trip.has_pet && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1 bg-accent/10 text-accent">
                  <PawPrint className="h-3 w-3" /> Chofer viaja con mascota
                </Badge>
              )}
              {trip.allows_luggage && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                  <Luggage className="h-3 w-3" /> Equipaje grande OK
                </Badge>
              )}
              {trip.zone && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                  <MapPin className="h-3 w-3" /> {trip.zone}
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
                {driverName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold font-heading">{driverName}</span>
                  {driver?.verified && <BadgeCheck className="h-5 w-5 text-accent" />}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <StarRating rating={driver?.average_rating ?? 0} size="sm" />
                    <span className="text-sm font-bold">{driver?.average_rating ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Car className="h-3.5 w-3.5" />
                    <span className="text-xs">{driver?.total_trips ?? 0} viajes</span>
                  </div>
                </div>
                {driver?.verified && (
                  <p className="text-[10px] text-accent mt-1 font-medium">✓ Identidad y vehículo verificados</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Booking flow */}
        {user?.id !== trip.driver_id && (
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
                      <span className={`text-[8px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status messages */}
              {bookingStatus === 'none' && !rejected && (
                <div className="bg-secondary/60 rounded-xl p-3 mb-4 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">¿Cómo funciona?</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      1. Reservás tu lugar → 2. El chofer te confirma → 3. Coordinan por chat → 4. Confirmás y pagás → 5. ¡Viaje confirmado!
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
                    <p className="text-[11px] text-muted-foreground">Ahora se abre un chat breve para coordinar punto de encuentro, horario y detalles.</p>
                  </div>
                </div>
              )}

              {bookingStatus === 'coordinating' && (
                <div className="bg-primary/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                  <Handshake className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-primary">Coordinando</p>
                    <p className="text-[11px] text-muted-foreground">Usá el chat para confirmar punto de encuentro, horario exacto y cualquier detalle.</p>
                  </div>
                </div>
              )}

              {bookingStatus === 'paid' && (
                <div className="bg-accent/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-accent">¡Viaje confirmado!</p>
                    <p className="text-[11px] text-muted-foreground">Pago recibido. Podés seguir usando el chat para coordinar detalles.</p>
                  </div>
                </div>
              )}

              {rejected && (
                <div className="bg-destructive/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                  <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">El chofer no aceptó</p>
                    <p className="text-[11px] text-muted-foreground">No te preocupes, hay muchos viajes disponibles.</p>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-2">
                {bookingStatus === 'none' && !rejected && trip.available_seats > 0 && (
                  <Button
                    onClick={handleRequestSeat}
                    disabled={submitting}
                    className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                  >
                    <Send className="h-4 w-4" /> {submitting ? 'Enviando...' : 'Reservar mi lugar'}
                  </Button>
                )}

                {bookingStatus === 'accepted' && (
                  <Button
                    onClick={() => navigate(`/chat/${trip.id}?phase=coordination`)}
                    className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                  >
                    <MessageCircle className="h-4 w-4" /> Abrir chat de coordinación
                  </Button>
                )}

                {bookingStatus === 'paid' && (
                  <Button
                    onClick={() => navigate(`/chat/${trip.id}`)}
                    className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold"
                  >
                    <MessageCircle className="h-4 w-4" /> Chat con {driverName.split(' ')[0]}
                  </Button>
                )}

                {rejected && (
                  <Button onClick={() => navigate('/search')} variant="outline" className="w-full h-12 rounded-xl gap-2 text-sm">
                    Buscar otro viaje
                  </Button>
                )}

                {['pending', 'accepted', 'coordinating'].includes(bookingStatus) && (
                  <Button
                    variant="ghost"
                    className="w-full h-10 text-xs text-destructive gap-1"
                    onClick={handleCancel}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancelar solicitud
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default TripDetail;
