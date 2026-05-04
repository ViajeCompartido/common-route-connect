import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Car, User as UserIcon, ChevronRight, MapPin, Calendar, Clock, Users, DollarSign,
  PawPrint, Luggage, Info, Minus, Plus, Send, Coffee, Music, Snowflake, Ban,
  UserCheck, AlertTriangle, ArrowRight, Menu, Bell,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import LocationInput from '@/components/LocationInput';
import BottomNav from '@/components/BottomNav';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { normalizeLocation } from '@/lib/normalizeLocation';
import { isTripCreationValid } from '@/lib/tripUtils';
import { clampSeatCount, MAX_DRIVER_VEHICLE_SEATS } from '@/lib/seatUtils';
import { routePriceRanges } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import heroCarpool from '@/assets/hero-publish-road.jpg';
import weegoLogo from '@/assets/weego-logo.png';
import SideMenu from '@/components/SideMenu';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

type Mode = 'choose' | 'driver' | 'passenger';

interface NearbyRequest {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  created_at: string;
}

const formatNearbyDate = (date: string, time: string) => {
  try {
    const d = parseISO(`${date}T${time}`);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    if (isToday) return `Hoy ${format(d, 'HH:mm')}`;
    if (isTomorrow) return `Mañana ${format(d, 'HH:mm')}`;
    return format(d, "d 'de' MMM HH:mm", { locale: es });
  } catch { return `${date} ${time}`; }
};

const formatRelative = (created: string) => {
  try {
    const ms = Date.now() - new Date(created).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `hace ${mins || 1} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const days = Math.floor(hrs / 24);
    return `hace ${days} d`;
  } catch { return ''; }
};

const PublishHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDriver, isProfileComplete, isDriverProfileComplete, driverProfile, loading: profileLoading } = useProfile();
  const [mode, setMode] = useState<Mode>('choose');
  const [nearby, setNearby] = useState<NearbyRequest[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalUnread } = useUnreadMessages();
  const hasUnread = totalUnread > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('ride_requests')
        .select('id, origin, destination, date, time, seats, created_at')
        .eq('status', 'active')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3);
      if (!cancelled && data) setNearby(data as NearbyRequest[]);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-background">
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <button
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 text-foreground active:opacity-70"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={weegoLogo} alt="WEEGO" className="h-14 w-14 object-contain drop-shadow-md" />
            <span className="font-heading font-bold text-2xl tracking-tight">
              WEE<span className="text-primary">GO</span>
            </span>
          </div>
          <button
            aria-label="Notificaciones"
            onClick={() => navigate('/notifications')}
            className="p-2 -mr-2 relative text-foreground active:opacity-70"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
            )}
          </button>
        </div>
      </header>

      {mode === 'choose' && (
        <div className="px-4 pt-4 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden shadow-lg"
            style={{ aspectRatio: '16 / 11' }}
          >
            <img src={heroCarpool} alt="Auto en ruta" className="absolute inset-0 w-full h-full object-cover" />
            {/* Overlay verde degradado: fuerte a la izquierda, foto visible a la derecha */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(105deg, hsl(var(--primary) / 0.92) 0%, hsl(var(--primary) / 0.78) 38%, hsl(var(--primary) / 0.30) 70%, hsl(var(--primary) / 0.05) 100%)',
              }}
            />
            <div className="relative h-full flex flex-col justify-between p-5">
              <div />
              <div className="text-primary-foreground">
                <h1 className="font-heading font-extrabold text-[28px] leading-[1.05] drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
                  ¿Qué querés<br />hacer hoy?
                </h1>
                <p className="text-sm mt-2 text-primary-foreground/95 leading-snug max-w-[70%] drop-shadow-[0_1px_4px_rgba(0,0,0,0.25)]">
                  Publicá tu viaje o encontrá quién te lleve.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 space-y-4 mt-4">
        {mode === 'choose' && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="bg-primary/8 border border-primary/20 rounded-2xl p-3.5 flex items-start gap-3"
            >
              <div className="w-7 h-7 rounded-full border-2 border-primary/60 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-[12.5px] text-foreground/80 leading-relaxed">
                Podés ofrecer tu viaje o publicar una solicitud.<br />
                Los choferes o pasajeros interesados te contactarán.
              </p>
            </motion.div>

            {/* TARJETA CHOFER - destacada en verde */}
            <motion.button
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
              onClick={() => {
                if (!isDriver) { toast.error('Activá tu perfil de chofer para publicar viajes.'); navigate('/activate-driver'); return; }
                if (!isDriverProfileComplete) { toast.error('Completá tu perfil de chofer.'); navigate('/activate-driver'); return; }
                navigate('/publish');
              }}
              className="relative w-full rounded-2xl p-5 text-left active:scale-[0.98] transition-all flex items-center gap-4 overflow-hidden shadow-lg"
              style={{
                background:
                  'linear-gradient(115deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 55%, hsl(var(--primary) / 0.85) 100%)',
              }}
            >
              {/* Decoración blob */}
              <div
                className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full opacity-25"
                style={{ background: 'radial-gradient(circle, hsl(var(--primary-foreground) / 0.4) 0%, transparent 70%)' }}
              />
              <div className="relative w-16 h-16 rounded-full bg-primary-foreground flex items-center justify-center shrink-0 shadow-md">
                <Car className="h-8 w-8 text-primary" strokeWidth={2.2} />
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-[17px] font-heading font-extrabold text-primary-foreground leading-tight">Publicar viaje</p>
                  <span className="text-[9px] font-extrabold text-primary bg-primary-foreground px-2 py-0.5 rounded-md tracking-wide">CHOFER</span>
                </div>
                <p className="text-[12.5px] text-primary-foreground/95 leading-snug">
                  Ofrecé lugares en tu auto<br />y encontrá pasajeros.
                </p>
              </div>
              <div className="relative w-9 h-9 rounded-full bg-primary-foreground/15 border border-primary-foreground/25 flex items-center justify-center shrink-0">
                <ChevronRight className="h-5 w-5 text-primary-foreground" />
              </div>
            </motion.button>

            {/* TARJETA PASAJERO - clara */}
            <motion.button
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14 }}
              onClick={() => {
                if (!isProfileComplete) { toast.error('Completá tu perfil para continuar.'); navigate('/edit-profile'); return; }
                navigate('/need-ride');
              }}
              className="w-full bg-card border border-border rounded-2xl p-5 text-left active:scale-[0.98] transition-all flex items-center gap-4 hover:border-primary/40 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <UserIcon className="h-8 w-8 text-primary" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-[17px] font-heading font-extrabold text-foreground leading-tight">Solicitar viaje</p>
                  <span className="text-[9px] font-extrabold text-primary bg-primary/15 px-2 py-0.5 rounded-md tracking-wide">PASAJERO</span>
                </div>
                <p className="text-[12.5px] text-muted-foreground leading-snug">
                  Decí a dónde necesitás ir<br />y los choferes te contactan.
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
                <ChevronRight className="h-5 w-5 text-primary-foreground" />
              </div>
            </motion.button>

            {/* SECCIÓN INFERIOR - beneficios */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="pt-4"
            >
              <p className="text-[15px] font-heading font-extrabold text-foreground mb-3">¡Más opciones, más viajes!</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Car, title: 'Publicá tu viaje', sub: 'y llená tu auto.' },
                  { icon: UserIcon, title: 'Solicitá un viaje', sub: 'si no encontrás opciones.' },
                  { icon: Send, title: 'Chateá, acordá', sub: 'y viajá seguro.' },
                ].map((b, i) => (
                  <div key={i} className="flex flex-col items-start gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center">
                      <b.icon className="h-4.5 w-4.5 text-primary" strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="text-[11.5px] font-bold text-foreground leading-tight">{b.title}</p>
                      <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">{b.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {nearby.length > 0 && (
              <div className="pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-heading font-bold text-foreground">Viajes solicitados cerca de vos</h2>
                  <button onClick={() => navigate('/driver-requests')} className="text-xs text-primary font-semibold active:opacity-70">Ver todos</button>
                </div>
                <div className="space-y-2.5">
                  {nearby.map(r => (
                    <div key={r.id} className="bg-card rounded-2xl p-4 border border-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-sm font-bold text-foreground">{r.origin}</p>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-sm font-bold text-foreground">{r.destination}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{formatNearbyDate(r.date, r.time)}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.seats} pasajero{r.seats > 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Solicitado {formatRelative(r.created_at)}</span>
                        </div>
                        <Button size="sm" onClick={() => navigate('/driver-requests')} className="h-8 px-3 rounded-lg text-[11px] bg-primary text-primary-foreground">
                          Ver solicitud
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'driver' && (
          <DriverForm onBack={() => setMode('choose')} driverProfile={driverProfile} />
        )}
        {mode === 'passenger' && (
          <PassengerForm onBack={() => setMode('choose')} />
        )}
      </div>

      <BottomNav />
    </div>
  );
};

// ============= DRIVER FORM =============
const DriverForm = ({ onBack, driverProfile }: { onBack: () => void; driverProfile: any }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [maxVehicleSeats, setMaxVehicleSeats] = useState(4);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    totalSeats: 4, pricePerSeat: '',
    acceptsPets: false, petSizesAccepted: [] as string[],
    hasPet: false, petSize: '',
    allowsLuggage: true,
    bringMate: false, music: true, ac: true, noSmoking: true, womenOnly: false,
    observations: '',
  });

  useEffect(() => {
    if (driverProfile) {
      const m = clampSeatCount(driverProfile.max_seats, 1, MAX_DRIVER_VEHICLE_SEATS, 4);
      setMaxVehicleSeats(m);
      setForm(f => ({ ...f, totalSeats: Math.min(f.totalSeats, m), acceptsPets: driverProfile.accepts_pets, petSizesAccepted: driverProfile.pet_sizes_accepted || [] }));
    }
  }, [driverProfile]);

  const priceNum = parseInt(form.pricePerSeat) || 0;
  const matchedRoute = routePriceRanges.find(r => {
    const o = form.origin.toLowerCase(); const d = form.destination.toLowerCase();
    return (r.routeKey.includes('buenos_aires') && (o.includes('buenos aires') || o.includes('palermo')) && d.includes('plata'))
      || (r.routeKey.includes('punta_alta') && o.includes('punta alta') && d.includes('bahía'));
  });
  const priceWarning = matchedRoute && priceNum > matchedRoute.max;

  const togglePetSize = (size: string) => setForm(f => ({
    ...f, petSizesAccepted: f.petSizesAccepted.includes(size) ? f.petSizesAccepted.filter(s => s !== size) : [...f.petSizesAccepted, size],
  }));

  const adjustSeats = (delta: number) => {
    setForm(f => ({ ...f, totalSeats: Math.max(1, Math.min(maxVehicleSeats, f.totalSeats + delta)) }));
  };

  const buildObservations = () => {
    const tags: string[] = [];
    if (form.bringMate) tags.push('🧉 Llevo mate');
    if (form.music) tags.push('🎵 Música');
    if (form.ac) tags.push('❄️ A/C');
    if (form.noSmoking) tags.push('🚭 Sin fumar');
    if (form.womenOnly) tags.push('👩 Solo mujeres');
    const prefix = tags.length ? tags.join(' · ') : '';
    if (prefix && form.observations) return `${prefix}\n${form.observations}`;
    return prefix || form.observations || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTripCreationValid(form.date, form.time)) { toast.error('La fecha y hora del viaje tienen que ser futuras.'); return; }
    if (priceWarning) { toast.error(`El precio supera el máximo permitido ($${matchedRoute!.max.toLocaleString()}).`); return; }
    if (!user) { toast.error('Tenés que iniciar sesión.'); return; }
    if (form.hasPet && !form.petSize) { toast.error('Indicá el tamaño de tu mascota.'); return; }
    if (form.acceptsPets && form.petSizesAccepted.length === 0) { toast.error('Seleccioná los tamaños aceptados.'); return; }

    setLoading(true);
    const { data, error } = await supabase.from('trips').insert({
      driver_id: user.id,
      origin: normalizeLocation(form.origin),
      destination: normalizeLocation(form.destination),
      date: form.date, time: form.time,
      total_seats: form.totalSeats, available_seats: form.totalSeats,
      price_per_seat: parseInt(form.pricePerSeat),
      accepts_pets: form.acceptsPets,
      has_pet: form.hasPet,
      pet_size: form.hasPet ? form.petSize : null,
      allows_luggage: form.allowsLuggage,
      observations: buildObservations(),
      status: 'active',
    }).select('id, status').single();

    if (driverProfile) {
      await supabase.from('driver_profiles').update({
        accepts_pets: form.acceptsPets, pet_sizes_accepted: form.petSizesAccepted,
      }).eq('user_id', user.id);
    }

    setLoading(false);
    if (error) { toast.error('No pudimos publicar el viaje.'); console.error(error); return; }
    toast.success('¡Listo! Tu viaje ya está publicado.');
    navigate('/my-trips', { state: { highlightTripId: data?.id } });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <FormHeader icon={Car} label="Publicar viaje" badge="CHOFER" subtitle="Ofrecé lugares en tu auto y encontrá pasajeros." onBack={onBack} />

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 border border-border space-y-5 mt-3">
        <SectionTitle>Datos del viaje</SectionTitle>

        <div className="space-y-3">
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">¿Desde dónde salís?</Label>
            <LocationInput value={form.origin} onChange={v => setForm({ ...form, origin: v })} placeholder="Origen" iconColor="text-primary" required />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">¿A dónde vas?</Label>
            <LocationInput value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="Destino" iconColor="text-primary" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Fecha</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Hora aproximada</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <SectionTitle>Cantidad de lugares</SectionTitle>
          <Label className="text-[12px] text-foreground mt-1 block">¿Cuántos lugares ofrecés?</Label>
          <div className="mt-2 flex items-center bg-secondary/50 rounded-xl h-12 px-2">
            <UserIcon className="h-4 w-4 text-muted-foreground mx-2" />
            <button type="button" onClick={() => adjustSeats(-1)} className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center active:scale-95"><Minus className="h-4 w-4" /></button>
            <div className="flex-1 text-center text-base font-bold text-foreground">{form.totalSeats}</div>
            <button type="button" onClick={() => adjustSeats(1)} className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95"><Plus className="h-4 w-4" /></button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Máximo {maxVehicleSeats} lugares</p>
        </div>

        <div className="border-t border-border pt-4">
          <SectionTitle>Precio por asiento</SectionTitle>
          <div className="relative mt-2">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
            </div>
            <Input type="number" inputMode="numeric" placeholder={matchedRoute ? `Sugerido: $${matchedRoute.suggested.toLocaleString()}` : '$ 3000'} value={form.pricePerSeat} onChange={e => setForm({ ...form, pricePerSeat: e.target.value })} className="pl-12 h-12 rounded-xl text-base font-semibold" required />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">Es el precio que paga cada pasajero.</p>
          {matchedRoute && (
            <div className={cn('mt-2 rounded-xl p-2.5 flex items-start gap-2 text-[11px]', priceWarning ? 'bg-destructive/10 border border-destructive/20' : 'bg-secondary/60')}>
              {priceWarning ? <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /> : <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />}
              <p className="text-muted-foreground">
                {priceWarning ? <>Supera el máximo permitido (${matchedRoute.max.toLocaleString()}).</> : <>Rango: ${matchedRoute.min.toLocaleString()} – ${matchedRoute.max.toLocaleString()}</>}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3.5">
          <SectionTitle>Opciones del viaje</SectionTitle>
          <SwitchRow icon={<PawPrint className="h-4 w-4 text-primary" />} label="Acepto mascotas" checked={form.acceptsPets} onChange={v => setForm({ ...form, acceptsPets: v, petSizesAccepted: v ? form.petSizesAccepted : [] })} />
          {form.acceptsPets && (
            <div className="ml-7 flex gap-3">
              {PET_SIZES.map(s => (
                <label key={s.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <Checkbox checked={form.petSizesAccepted.includes(s.value)} onCheckedChange={() => togglePetSize(s.value)} />
                  {s.label}
                </label>
              ))}
            </div>
          )}
          <SwitchRow icon={<PawPrint className="h-4 w-4 text-ocean-light" />} label="Viajo con mi mascota" checked={form.hasPet} onChange={v => setForm({ ...form, hasPet: v, petSize: v ? form.petSize : '' })} />
          {form.hasPet && (
            <div className="ml-7">
              <Select value={form.petSize} onValueChange={v => setForm({ ...form, petSize: v })}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Tamaño de tu mascota" /></SelectTrigger>
                <SelectContent>{PET_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <SwitchRow icon={<Luggage className="h-4 w-4 text-foreground" />} label="Permito equipaje grande" checked={form.allowsLuggage} onChange={v => setForm({ ...form, allowsLuggage: v })} />
        </div>

        <div className="border-t border-border pt-4 space-y-3.5">
          <SectionTitle>Preferencias del viaje</SectionTitle>
          <SwitchRow icon={<Coffee className="h-4 w-4 text-primary" />} label="Llevo mate" checked={form.bringMate} onChange={v => setForm({ ...form, bringMate: v })} />
          <SwitchRow icon={<Music className="h-4 w-4 text-primary" />} label="Música" checked={form.music} onChange={v => setForm({ ...form, music: v })} />
          <SwitchRow icon={<Snowflake className="h-4 w-4 text-primary" />} label="Aire acondicionado" checked={form.ac} onChange={v => setForm({ ...form, ac: v })} />
          <SwitchRow icon={<Ban className="h-4 w-4 text-primary" />} label="Sin fumar" checked={form.noSmoking} onChange={v => setForm({ ...form, noSmoking: v })} />
          <SwitchRow icon={<UserIcon className="h-4 w-4 text-primary" />} label="Solo mujeres" checked={form.womenOnly} onChange={v => setForm({ ...form, womenOnly: v })} />
        </div>

        <div className="border-t border-border pt-4">
          <Label className="text-[11px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold">Observaciones (opcional)</Label>
          <Textarea placeholder="Ej: Salgo puntual, paso por autopista, acepto mascotas chicas..." value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} className="rounded-xl resize-none" rows={3} />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-13 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold gap-2 shadow-lg shadow-primary/25">
          <Car className="h-4 w-4" /> {loading ? 'Publicando...' : 'Publicar viaje'}
        </Button>
      </form>
    </motion.div>
  );
};

// ============= PASSENGER FORM =============
const PassengerForm = ({ onBack }: { onBack: () => void }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    seats: 1, hasPet: false, petSize: '', hasLuggage: false, message: '',
  });

  const adjustSeats = (delta: number) => setForm(f => ({ ...f, seats: Math.max(1, Math.min(6, f.seats + delta)) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Iniciá sesión primero.'); return; }
    if (form.hasPet && !form.petSize) { toast.error('Indicá el tamaño de tu mascota.'); return; }
    if (!isTripCreationValid(form.date, form.time)) { toast.error('La fecha y hora deben ser futuras.'); return; }

    setLoading(true);
    const { data, error } = await supabase.from('ride_requests').insert({
      passenger_id: user.id,
      origin: normalizeLocation(form.origin),
      destination: normalizeLocation(form.destination),
      date: form.date, time: form.time,
      seats: form.seats,
      has_pet: form.hasPet,
      pet_size: form.hasPet ? form.petSize : null,
      has_luggage: form.hasLuggage,
      message: form.message || null,
      status: 'active',
    }).select('id, status').single();
    setLoading(false);

    if (error) { toast.error('No pudimos publicar tu solicitud.'); console.error(error); return; }
    toast.success('¡Listo! Tu solicitud está publicada.');
    navigate('/my-trips', { state: { highlightRequestId: data?.id } });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <FormHeader icon={UserIcon} label="Solicitar viaje" badge="PASAJERO" subtitle="Contá a dónde querés ir y los choferes te contactan." onBack={onBack} variant="soft" />

      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 border border-border space-y-5 mt-3">
        <SectionTitle>¿A dónde querés ir?</SectionTitle>

        <div className="grid grid-cols-2 gap-3">
          <LocationInput value={form.origin} onChange={v => setForm({ ...form, origin: v })} placeholder="Desde (origen)" iconColor="text-primary" required />
          <LocationInput value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="Destino" iconColor="text-primary" required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Fecha</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground mb-1 block">Hora aproximada</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <SectionTitle>Cantidad de pasajeros</SectionTitle>
          <div className="mt-2 flex items-center bg-secondary/50 rounded-xl h-12 px-2">
            <UserIcon className="h-4 w-4 text-muted-foreground mx-2" />
            <button type="button" onClick={() => adjustSeats(-1)} className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center active:scale-95"><Minus className="h-4 w-4" /></button>
            <div className="flex-1 text-center text-base font-bold text-foreground">{form.seats}</div>
            <button type="button" onClick={() => adjustSeats(1)} className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95"><Plus className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3.5">
          <SwitchRow icon={<PawPrint className="h-4 w-4 text-primary" />} label="Viajo con mascota" checked={form.hasPet} onChange={v => setForm({ ...form, hasPet: v, petSize: v ? form.petSize : '' })} />
          {form.hasPet && (
            <div className="ml-7">
              <Select value={form.petSize} onValueChange={v => setForm(p => ({ ...p, petSize: v }))}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Tamaño de tu mascota" /></SelectTrigger>
                <SelectContent>{PET_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <SwitchRow icon={<Luggage className="h-4 w-4 text-foreground" />} label="Llevo equipaje grande" checked={form.hasLuggage} onChange={v => setForm({ ...form, hasLuggage: v })} />
        </div>

        <div className="border-t border-border pt-4">
          <Label className="text-[11px] text-muted-foreground mb-1.5 block uppercase tracking-wider font-bold">Detalles (opcional)</Label>
          <Textarea placeholder="Ej: Viajo por trabajo, llevo bolso pequeño, necesito llegar antes del mediodía..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="rounded-xl resize-none" rows={3} />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-13 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold gap-2 shadow-lg shadow-primary/25">
          <Send className="h-4 w-4" /> {loading ? 'Publicando...' : 'Publicar solicitud'}
        </Button>
      </form>
    </motion.div>
  );
};

// ============= helpers =============
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] font-heading font-bold text-muted-foreground uppercase tracking-wider">{children}</h3>
);

const SwitchRow = ({ icon, label, checked, onChange }: { icon: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between">
    <Label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">{icon} {label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const FormHeader = ({ icon: Icon, label, badge, subtitle, onBack, variant = 'solid' }: {
  icon: any; label: string; badge: string; subtitle: string; onBack: () => void; variant?: 'solid' | 'soft';
}) => (
  <div className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', variant === 'solid' ? 'bg-primary' : 'bg-primary/15')}>
      <Icon className={cn('h-6 w-6', variant === 'solid' ? 'text-primary-foreground' : 'text-primary')} strokeWidth={2.2} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-base font-heading font-bold text-foreground">{label}</p>
        <span className="text-[9px] font-bold text-primary bg-primary/12 px-2 py-0.5 rounded-full">{badge}</span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-snug">{subtitle}</p>
    </div>
    <button type="button" onClick={onBack} className="text-[11px] text-primary font-semibold active:opacity-70 px-2">Cambiar</button>
  </div>
);

export default PublishHub;
