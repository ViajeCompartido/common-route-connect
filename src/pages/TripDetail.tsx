import { useParams, useNavigate } from 'react-router-dom';
import { getInitial } from '@/lib/avatarUtils';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, MessageCircle, BadgeCheck, Car, Send, CheckCircle2, CreditCard, XCircle, Info, Handshake, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import TripRouteMap from '@/components/TripRouteMap';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { calculatePriceBreakdown } from '@/lib/tripUtils';
import { formatPrice } from '@/lib/formatPrice';
import { getSeatSummary } from '@/lib/seatUtils';

type BookingStep = 'none' | 'pending' | 'accepted' | 'coordinating' | 'confirmed' | 'paid';

interface ExistingBooking {
  id: string;
  status: string;
  seats: number;
  price_per_seat: number;
  pet_surcharge: number | null;
}

const paymentEnabledStatuses = ['accepted', 'coordinating'];
const paidStatuses = ['paid', 'driver_on_way', 'driver_arrived', 'in_transit', 'completed'];

const mapBookingStatusToStep = (status: string): BookingStep => {
  if (status === 'pending') return 'pending';
  if (paymentEnabledStatuses.includes(status)) return 'coordinating';
  if (paidStatuses.includes(status)) return 'paid';
  return 'none';
};

const flowSteps = [
  { key: 'none', label: 'Solicitar', icon: Send },
  { key: 'pending', label: 'Esperar', icon: Clock },
  { key: 'accepted', label: 'Aceptado', icon: CheckCircle2 },
  { key: 'coordinating', label: 'Coordinar', icon: MessageCircle },
  { key: 'confirmed', label: 'Pagar', icon: CreditCard },
  { key: 'paid', label: '¡Listo!', icon: CheckCircle2 },
];

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

const PET_SIZE_LABELS: Record<string, string> = { small: 'Chica', medium: 'Mediana', large: 'Grande' };

interface TripData {
  id: string; origin: string; destination: string; date: string; time: string;
  available_seats: number; total_seats: number; price_per_seat: number;
  accepts_pets: boolean; has_pet: boolean; allows_luggage: boolean;
  zone: string | null; meeting_point: string | null; observations: string | null;
  driver_id: string; status: string; pet_size: string | null;
}

interface DriverProfile {
  first_name: string; last_name: string; average_rating: number;
  total_trips: number; verified: boolean;
}

interface DriverVehicle {
  vehicle: string | null;
  plate: string | null;
  color: string | null;
  pet_sizes_accepted: string[] | null;
}

interface PetSurcharge { size: string; surcharge: number; }

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProfileComplete, loading: profileLoading } = useProfile();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [driverPetSizes, setDriverPetSizes] = useState<string[]>([]);
  const [petSurcharges, setPetSurcharges] = useState<PetSurcharge[]>([]);
  const [bookingStatus, setBookingStatus] = useState<BookingStep>('none');
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [existingBooking, setExistingBooking] = useState<ExistingBooking | null>(null);
  const [rejected, setRejected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [reqSeats, setReqSeats] = useState(1);
  const [reqHasPet, setReqHasPet] = useState(false);
  const [reqPetSize, setReqPetSize] = useState('');
  const [reqHasLuggage, setReqHasLuggage] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadTrip();
    supabase.from('pet_surcharges').select('size, surcharge').then(({ data }) => {
      if (data) setPetSurcharges(data);
    });
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    const interval = window.setInterval(() => {
      syncExistingBooking(id, user.id);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [id, user]);

  const syncExistingBooking = async (tripId: string, passengerId: string) => {
    const { data } = await supabase.from('bookings')
      .select('id, status, seats, price_per_seat, pet_surcharge')
      .eq('trip_id', tripId)
      .eq('passenger_id', passengerId)
      .not('status', 'in', '("cancelled_passenger","cancelled_driver","rejected")')
      .maybeSingle();

    if (!data) {
      setExistingBooking(null);
      setBookingId(null);
      setBookingStatus('none');
      return;
    }

    setExistingBooking(data as ExistingBooking);
    setBookingId(data.id);
    setBookingStatus(mapBookingStatusToStep(data.status));
  };

  const loadTrip = async () => {
    setLoading(true);
    const { data: tripData, error } = await supabase.from('trips').select('*').eq('id', id).single();
    if (error || !tripData) { setLoading(false); return; }
    setTrip(tripData as TripData);

    const [{ data: profileData }, { data: driverData }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name, average_rating, total_trips, verified').eq('id', tripData.driver_id).single(),
      supabase.from('driver_profiles').select('vehicle, plate, color, pet_sizes_accepted').eq('user_id', tripData.driver_id).maybeSingle(),
    ]);
    if (profileData) setDriver(profileData);
    if (driverData) {
      setVehicle({
        vehicle: driverData.vehicle ?? null,
        plate: driverData.plate ?? null,
        color: driverData.color ?? null,
        pet_sizes_accepted: (driverData.pet_sizes_accepted as string[] | null) ?? null,
      });
      if (driverData.pet_sizes_accepted) setDriverPetSizes(driverData.pet_sizes_accepted as string[]);
    }

    if (user) {
      await syncExistingBooking(tripData.id, user.id);
    }
    setLoading(false);
  };

  const petSurcharge = reqHasPet && reqPetSize
    ? petSurcharges.find(p => p.size === reqPetSize)?.surcharge ?? 0
    : 0;

  const breakdown = trip ? calculatePriceBreakdown(Number(trip.price_per_seat), reqSeats, petSurcharge) : null;
  const bookedBreakdown = existingBooking
    ? calculatePriceBreakdown(Number(existingBooking.price_per_seat), existingBooking.seats, Number(existingBooking.pet_surcharge) || 0)
    : null;
  const seatSummary = trip ? getSeatSummary(trip.total_seats, trip.available_seats) : null;

  const handleRequestSeat = async () => {
    if (!user || !trip) return;

    if (!isProfileComplete) {
      toast.error('Completá tu perfil para continuar.');
      navigate('/edit-profile');
      return;
    }

    if (reqHasPet && !reqPetSize) {
      toast.error('Indicá el tamaño de tu mascota.');
      return;
    }
    if (reqHasPet && !trip.accepts_pets) {
      toast.error('Este chofer no acepta mascotas.');
      return;
    }
    if (reqHasPet && reqPetSize && driverPetSizes.length > 0 && !driverPetSizes.includes(reqPetSize)) {
      toast.error(`Este chofer no acepta mascotas de tamaño ${PET_SIZE_LABELS[reqPetSize]?.toLowerCase()}.`);
      return;
    }
    if (reqSeats < 1 || reqSeats > trip.available_seats) {
      toast.error('La cantidad de asientos solicitados no está disponible.');
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.from('bookings').insert({
      trip_id: trip.id,
      passenger_id: user.id,
      driver_id: trip.driver_id,
      seats: reqSeats,
      price_per_seat: trip.price_per_seat,
      has_pet: reqHasPet,
      pet_size: reqHasPet ? reqPetSize : null,
      pet_surcharge: petSurcharge,
      has_luggage: reqHasLuggage,
      status: 'pending',
    }).select('id').single();

    setSubmitting(false);
    if (error) {
      toast.error('No pudimos enviar la solicitud. Intentá de nuevo.');
      console.error(error);
      return;
    }
    setBookingId(data.id);
    setExistingBooking({
      id: data.id,
      status: 'pending',
      seats: reqSeats,
      price_per_seat: Number(trip.price_per_seat),
      pet_surcharge: petSurcharge,
    });
    setBookingStatus('pending');
    toast.success('¡Solicitud enviada!');
  };

  const handleCancel = async () => {
    if (!bookingId) return;
    await supabase.from('bookings').update({ status: 'cancelled_passenger' }).eq('id', bookingId);
    setBookingStatus('none');
    setBookingId(null);
    setExistingBooking(null);
    setRejected(false);
    toast('Solicitud cancelada.');
  };

  const handlePay = async () => {
    if (!bookingId || !trip) return;
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { booking_id: bookingId },
      });
      if (error) throw error;
      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        toast.error('No se pudo generar el link de pago.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Error al iniciar el pago. Intentá de nuevo.');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading || profileLoading) {
    return <div className="min-h-screen pb-24 flex items-center justify-center"><p className="text-muted-foreground">Cargando viaje...</p></div>;
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
        {/* Map with route */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <TripRouteMap
            origin={trip.origin}
            destination={trip.destination}
            vehicleColor={vehicle?.color}
            onExpand={() => {
              const q = encodeURIComponent(`${trip.origin} a ${trip.destination}`);
              window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.origin)}&destination=${encodeURIComponent(trip.destination)}`, '_blank');
            }}
          />
        </motion.div>

        {/* Meeting point card */}
        {trip.meeting_point && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
            <div className="bg-accent/5 rounded-2xl p-4 border border-accent/20 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-accent uppercase tracking-wider">Punto de encuentro sugerido</p>
                <p className="text-sm font-semibold mt-0.5 leading-tight">{trip.meeting_point}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{trip.origin}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-[11px] gap-1 shrink-0 border-accent/40 text-accent hover:bg-accent/10"
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.meeting_point + ' ' + trip.origin)}`, '_blank')}
              >
                <MapPin className="h-3 w-3" /> Ver en mapa
              </Button>
            </div>
          </motion.div>
        )}

        {/* Route card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
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
                {trip.meeting_point && <p className="text-[10px] text-accent mt-0.5">📍 {trip.meeting_point}</p>}
                <p className="text-xs text-muted-foreground mt-5">Llega a</p>
                <p className="font-semibold text-sm">{trip.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-heading font-bold text-primary">{formatPrice(Number(trip.price_per_seat))}</p>
                <p className="text-[10px] text-muted-foreground">por asiento</p>
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-t border-border text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{trip.date} · {trip.time}hs</span></div>
              <div className="flex items-center gap-1.5"><Users className="h-4 w-4" /><span className="font-medium">{trip.available_seats} de {trip.total_seats} lugares libres</span></div>
            </div>

            {seatSummary && (
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Totales</p>
                  <p className="text-sm font-heading font-bold">{seatSummary.totalSeats}</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Ocupados</p>
                  <p className="text-sm font-heading font-bold">{seatSummary.occupiedSeats}</p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Disponibles</p>
                  <p className="text-sm font-heading font-bold">{seatSummary.availableSeats}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap pt-2">
              {trip.accepts_pets && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                  <PawPrint className="h-3 w-3" /> Acepta mascotas
                  {driverPetSizes.length > 0 && ` (${driverPetSizes.map(s => PET_SIZE_LABELS[s] || s).join(', ')})`}
                </Badge>
              )}
              {trip.has_pet && (
                <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1 bg-accent/10 text-accent">
                  <PawPrint className="h-3 w-3" /> Chofer viaja con mascota {trip.pet_size && `(${PET_SIZE_LABELS[trip.pet_size]})`}
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
                {getInitial(driver?.first_name)}
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
                {driver?.verified && <p className="text-[10px] text-accent mt-1 font-medium">✓ Identidad y vehículo verificados</p>}
              </div>
              {bookingId && user?.id !== trip.driver_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/chat/${bookingId}`)}
                  className="h-10 rounded-xl gap-1 text-xs shrink-0 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <MessageCircle className="h-4 w-4" /> Chat
                </Button>
              )}
            </div>
            {vehicle?.vehicle && (
              <div className="flex items-center gap-2 pt-3 border-t border-border text-xs text-muted-foreground">
                <Car className="h-3.5 w-3.5" />
                <span>
                  {vehicle.vehicle}
                  {vehicle.color && ` · ${vehicle.color}`}
                  {vehicle.plate && ` · ${vehicle.plate}`}
                </span>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-3 leading-snug">
              🔒 Por seguridad, no compartimos teléfonos ni redes sociales. Toda la comunicación se hace dentro de la app.
            </p>
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
                      <span className={`text-[8px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground/40'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Trip closed (full / cancelled / completed) message — only when user has no booking yet */}
              {bookingStatus === 'none' && !rejected && ['full', 'cancelled', 'completed', 'in_progress'].includes(trip.status) && (
                <div className="bg-muted/40 border border-border rounded-xl p-3 mb-4 flex items-center gap-2.5">
                  <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">
                      {trip.status === 'full' ? 'Viaje completo' :
                       trip.status === 'cancelled' ? 'Viaje cancelado' :
                       trip.status === 'completed' ? 'Viaje finalizado' : 'Viaje en curso'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {trip.status === 'full'
                        ? 'Este viaje ya no acepta nuevas reservas. Buscá otro disponible.'
                        : 'Este viaje ya no está disponible para reservar.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Request form */}
              {bookingStatus === 'none' && !rejected && trip.available_seats > 0 && trip.status === 'active' && (
                <div className="space-y-3 mb-4">
                  <div className="bg-secondary/60 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">¿Cuántas personas viajan?</Label>
                      <Select value={String(reqSeats)} onValueChange={v => setReqSeats(parseInt(v))}>
                        <SelectTrigger className="w-20 h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: trip.available_seats }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {trip.accepts_pets && (
                      <>
                        <div className="flex items-center justify-between">
                          <Label className="flex items-center gap-1.5 text-xs"><PawPrint className="h-3.5 w-3.5 text-accent" /> Viajo con mascota</Label>
                          <Switch checked={reqHasPet} onCheckedChange={v => { setReqHasPet(v); if (!v) setReqPetSize(''); }} />
                        </div>
                        {reqHasPet && (
                          <Select value={reqPetSize} onValueChange={setReqPetSize}>
                            <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue placeholder="Tamaño de mascota" /></SelectTrigger>
                            <SelectContent>
                              {PET_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    )}

                    {trip.allows_luggage && (
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-1.5 text-xs"><Luggage className="h-3.5 w-3.5" /> Llevo equipaje grande</Label>
                        <Switch checked={reqHasLuggage} onCheckedChange={setReqHasLuggage} />
                      </div>
                    )}
                  </div>

                  {/* Price breakdown with commission */}
                  {breakdown && (
                    <div className="bg-primary/5 rounded-xl p-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{reqSeats} asiento{reqSeats > 1 ? 's' : ''} × {formatPrice(Number(trip.price_per_seat))}</span>
                        <span>{formatPrice(breakdown.basePrice)}</span>
                      </div>
                      {breakdown.petSurcharge > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Adicional mascota ({PET_SIZE_LABELS[reqPetSize]})</span>
                          <span>+{formatPrice(breakdown.petSurcharge)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Cargo de servicio</span>
                        <span>+{formatPrice(breakdown.serviceFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-border pt-1 mt-1">
                        <span>Total a pagar</span>
                        <span className="text-primary">{formatPrice(breakdown.totalForPassenger)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">El chofer recibe {formatPrice(breakdown.driverReceives)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status messages */}
              {bookingStatus === 'pending' && (
                <div className="bg-ocean-light/10 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-ocean-light animate-pulse shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Solicitud enviada</p>
                    <p className="text-[11px] text-muted-foreground">Esperá la confirmación del chofer. Te avisamos cuando responda.</p>
                  </div>
                </div>
              )}
               {paymentEnabledStatuses.includes(existingBooking?.status || '') && bookedBreakdown && (
                 <div className="bg-primary/5 rounded-xl p-3 mb-4 space-y-1">
                   <p className="text-[11px] font-semibold text-primary">Resumen del pago</p>
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>{existingBooking?.seats} asiento{existingBooking?.seats && existingBooking.seats > 1 ? 's' : ''} × {formatPrice(Number(existingBooking?.price_per_seat || 0))}</span>
                     <span>{formatPrice(bookedBreakdown.basePrice)}</span>
                   </div>
                   {bookedBreakdown.petSurcharge > 0 && (
                     <div className="flex justify-between text-xs text-muted-foreground">
                       <span>Adicional mascota</span>
                       <span>+{formatPrice(bookedBreakdown.petSurcharge)}</span>
                     </div>
                   )}
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>Cargo de servicio</span>
                     <span>+{formatPrice(bookedBreakdown.serviceFee)}</span>
                   </div>
                   <div className="flex justify-between text-sm font-bold border-t border-border pt-1 mt-1">
                     <span>Total a pagar</span>
                     <span className="text-primary">{formatPrice(bookedBreakdown.totalForPassenger)}</span>
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

              {/* Action buttons */}
              <div className="space-y-2">
                {bookingStatus === 'none' && !rejected && trip.available_seats > 0 && (
                  <Button onClick={handleRequestSeat} disabled={submitting} className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold">
                    <Send className="h-4 w-4" /> {submitting ? 'Enviando...' : 'Reservar mi lugar'}
                  </Button>
                )}
                {paymentEnabledStatuses.includes(existingBooking?.status || '') && bookingId && (
                  <>
                    <Button onClick={() => navigate(`/chat/${bookingId}?phase=coordination`)} variant="outline" className="w-full h-12 gap-2 rounded-xl text-sm font-semibold">
                      <MessageCircle className="h-4 w-4" /> Chat de coordinación
                    </Button>
                    <Button onClick={handlePay} disabled={paymentLoading} className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold">
                      <CreditCard className="h-4 w-4" /> {paymentLoading ? 'Preparando pago...' : 'Pagar con Mercado Pago'}
                    </Button>
                  </>
                )}
                {bookingStatus === 'paid' && bookingId && (
                  <Button onClick={() => navigate(`/chat/${bookingId}`)} className="w-full h-12 gradient-accent text-primary-foreground gap-2 rounded-xl text-sm font-semibold">
                    <MessageCircle className="h-4 w-4" /> Chat con {driverName.split(' ')[0]}
                  </Button>
                )}
                {rejected && (
                  <Button onClick={() => navigate('/search')} variant="outline" className="w-full h-12 rounded-xl gap-2 text-sm">Buscar otro viaje</Button>
                )}
                {['pending', 'accepted', 'coordinating'].includes(bookingStatus) && (
                  <Button variant="ghost" className="w-full h-10 text-xs text-destructive gap-1" onClick={handleCancel}>
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
