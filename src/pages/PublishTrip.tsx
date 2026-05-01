import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, DollarSign, PawPrint, Luggage, Car, Info, AlertTriangle, Music, Snowflake, Cigarette, Coffee, Pencil, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LocationInput from '@/components/LocationInput';
import { normalizeLocation } from '@/lib/normalizeLocation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import AppHeader from '@/components/AppHeader';
import { routePriceRanges } from '@/data/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Checkbox } from '@/components/ui/checkbox';
import { isTripCreationValid } from '@/lib/tripUtils';
import { clampSeatCount } from '@/lib/seatUtils';
import heroRoad from '@/assets/hero-publish-road.jpg';

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

const PUBLIC_MAX_SEATS = 4;

const EXTRA_BADGES = [
  { key: 'mate', label: 'Llevo mate', icon: Coffee },
  { key: 'music', label: 'Música', icon: Music },
  { key: 'air', label: 'Aire', icon: Snowflake },
  { key: 'no_smoke', label: 'No fumar', icon: Cigarette },
];

const PublishTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { driverProfile, isDriver, isDriverProfileComplete, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    totalSeats: '1', pricePerSeat: '',
    acceptsPets: false, petSizesAccepted: [] as string[],
    hasPet: false, petSize: '',
    allowsLuggage: true,
    observations: '',
  });

  useEffect(() => {
    if (driverProfile) {
      setForm(f => ({
        ...f,
        totalSeats: String(clampSeatCount(f.totalSeats, 1, PUBLIC_MAX_SEATS, 1)),
        acceptsPets: driverProfile.accepts_pets,
        petSizesAccepted: driverProfile.pet_sizes_accepted || [],
      }));
    }
  }, [driverProfile]);

  useEffect(() => {
    if (!profileLoading && !isDriver) {
      toast.error('Activá tu perfil de chofer para publicar viajes.');
      navigate('/activate-driver');
    }
  }, [profileLoading, isDriver]);

  useEffect(() => {
    if (!profileLoading && isDriver && !isDriverProfileComplete) {
      toast.error('Completá tu perfil de chofer para publicar viajes.');
      navigate('/activate-driver');
    }
  }, [profileLoading, isDriverProfileComplete]);

  const priceNum = parseInt(form.pricePerSeat) || 0;
  const matchedRoute = routePriceRanges.find(r => {
    const o = form.origin.toLowerCase();
    const d = form.destination.toLowerCase();
    return (r.routeKey.includes('buenos_aires') && (o.includes('buenos aires') || o.includes('palermo') || o.includes('belgrano') || o.includes('caballito')) && (d.includes('la plata') || d.includes('plata')))
      || (r.routeKey.includes('punta_alta') && o.includes('punta alta') && d.includes('bahía'))
      || (r.routeKey.includes('cordoba') && o.includes('córdoba') && d.includes('rosario'))
      || (r.routeKey.includes('mar_del_plata') && (o.includes('buenos aires') || o.includes('palermo') || o.includes('belgrano')) && d.includes('mar del plata'));
  });
  const priceWarning = matchedRoute && priceNum > matchedRoute.max;

  const togglePetSize = (size: string) => {
    setForm(f => ({
      ...f,
      petSizesAccepted: f.petSizesAccepted.includes(size)
        ? f.petSizesAccepted.filter(s => s !== size)
        : [...f.petSizesAccepted, size],
    }));
  };

  const toggleExtra = (key: string) => {
    setExtras(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTripCreationValid(form.date, form.time)) {
      toast.error('La fecha y hora del viaje tienen que ser futuras para que permanezca visible.');
      return;
    }
    if (priceWarning) {
      toast.error(`El precio supera el máximo permitido para esta ruta ($${matchedRoute!.max.toLocaleString()}).`);
      return;
    }
    if (!user) {
      toast.error('Tenés que iniciar sesión para publicar un viaje.');
      return;
    }
    if (form.hasPet && !form.petSize) {
      toast.error('Indicá el tamaño de tu mascota.');
      return;
    }
    if (form.acceptsPets && form.petSizesAccepted.length === 0) {
      toast.error('Seleccioná qué tamaños de mascota aceptás.');
      return;
    }

    const totalSeats = clampSeatCount(form.totalSeats, 1, PUBLIC_MAX_SEATS, 1);
    if (!Number.isFinite(totalSeats) || totalSeats < 1) {
      toast.error('Indicá una cantidad válida de asientos.');
      return;
    }

    const extrasText = extras.length
      ? `[${extras.map(k => EXTRA_BADGES.find(b => b.key === k)?.label).filter(Boolean).join(' · ')}]`
      : '';
    const finalObservations = [form.observations.trim(), extrasText].filter(Boolean).join(' ').slice(0, 200);

    setLoading(true);
    const { data, error } = await supabase.from('trips').insert({
      driver_id: user.id,
      origin: normalizeLocation(form.origin),
      destination: normalizeLocation(form.destination),
      date: form.date,
      time: form.time,
      total_seats: totalSeats,
      available_seats: totalSeats,
      price_per_seat: parseInt(form.pricePerSeat),
      accepts_pets: form.acceptsPets,
      has_pet: form.hasPet,
      pet_size: form.hasPet ? form.petSize : null,
      allows_luggage: form.allowsLuggage,
      observations: finalObservations || null,
      status: 'active',
    }).select('id, status').single();

    if (driverProfile) {
      await supabase.from('driver_profiles').update({
        accepts_pets: form.acceptsPets,
        pet_sizes_accepted: form.petSizesAccepted,
      }).eq('user_id', user.id);
    }

    setLoading(false);

    if (error) {
      toast.error('No pudimos publicar el viaje. Intentá de nuevo.');
      console.error(error);
      return;
    }
    if (!data?.id || data.status !== 'active') {
      toast.error('El viaje se creó con un estado inesperado. Revisalo en Mis viajes.');
      return;
    }
    toast.success('¡Listo! Tu viaje ya está publicado.');
    navigate('/my-trips', { state: { highlightTripId: data.id } });
  };

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando...</p></div>;

  const seatsNum = parseInt(form.totalSeats) || 1;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <AppHeader />

      {/* Hero with road image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={heroRoad}
          alt="Auto en ruta"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Vertical gradient for overall blending */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.15) 55%, hsl(var(--background) / 0.95) 100%)',
          }}
        />
        {/* Left-side darkening for text legibility, keeps right (car) clean */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, hsl(var(--primary) / 0.75) 0%, hsl(var(--primary) / 0.5) 30%, transparent 65%)',
          }}
        />
        <div className="relative z-10 max-w-lg mx-auto px-5 h-full flex flex-col justify-start pt-4">
          <div className="flex items-center gap-2 mb-1 max-w-[60%]">
            <Car className="h-5 w-5 text-accent drop-shadow" />
            <h1 className="text-xl font-heading font-bold text-primary-foreground drop-shadow-md leading-tight">
              Publicar un viaje
            </h1>
          </div>
          <p className="text-xs text-primary-foreground/95 drop-shadow-md max-w-[55%] leading-snug">
            Cargá los datos y encontrá pasajeros compatibles.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-3 space-y-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-accent/10 rounded-2xl p-4 flex items-start gap-2.5 mb-3 border border-accent/20">
            <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[12px] text-foreground/80 leading-relaxed">
              Tu viaje aparece en las búsquedas mientras tenga lugares disponibles. Podés pausarlo o cerrarlo en cualquier momento desde "Mis viajes".
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Datos del viaje */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-heading font-bold text-primary uppercase tracking-wide mb-4">
                <Calendar className="h-4 w-4" /> Datos del viaje
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1.5 block">¿Desde dónde salís?</Label>
                  <LocationInput value={form.origin} onChange={v => setForm({ ...form, origin: v })} placeholder="Ej: Córdoba" iconColor="text-accent" required />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-1.5 block">¿A dónde vas?</Label>
                  <LocationInput value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="Ej: Buenos Aires" iconColor="text-primary" required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1.5 block">Fecha</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1.5 block">Hora aproximada</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1.5 block">
                      Cantidad de pasajeros (máx. 4)
                    </Label>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: PUBLIC_MAX_SEATS }, (_, i) => i + 1).map(n => {
                        const active = form.totalSeats === String(n);
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setForm({ ...form, totalSeats: String(n) })}
                            className={`h-14 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                              active
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-card text-foreground border-border hover:border-primary/40'
                            }`}
                            aria-pressed={active}
                          >
                            <span>{n}</span>
                            <span className={`text-[10px] font-medium ${active ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                              {n === 1 ? 'pasajero' : 'pasajeros'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground mb-1.5 block">Precio por asiento</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input type="number" placeholder={matchedRoute ? `Sugerido: ${matchedRoute.suggested.toLocaleString()}` : 'Ej: 3000'} value={form.pricePerSeat} onChange={e => setForm({ ...form, pricePerSeat: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 flex items-start gap-2.5">
                  <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="text-[12px] leading-relaxed text-foreground/80">
                    <p>
                      Llevás <span className="font-semibold text-primary">{seatsNum} {seatsNum === 1 ? 'pasajero' : 'pasajeros'}</span>. Máximo 4 pasajeros por viaje.
                    </p>
                    <p className="text-muted-foreground">Más lugares = más posibilidades de conseguir pasajeros.</p>
                  </div>
                </div>

                {matchedRoute && (
                  <div className={`rounded-xl p-3 flex items-start gap-2 text-[11px] ${priceWarning ? 'bg-destructive/10 border border-destructive/20' : 'bg-secondary/60'}`}>
                    {priceWarning ? (
                      <>
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-destructive">El precio supera el máximo permitido</p>
                          <p className="text-muted-foreground">Para esta ruta el rango es ${matchedRoute.min.toLocaleString()} – ${matchedRoute.max.toLocaleString()}. Sugerido: ${matchedRoute.suggested.toLocaleString()}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                          Precio sugerido: <span className="font-semibold text-foreground">${matchedRoute.suggested.toLocaleString()}</span> · Rango: ${matchedRoute.min.toLocaleString()} – ${matchedRoute.max.toLocaleString()}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Opciones del viaje */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-heading font-bold text-primary uppercase tracking-wide">
                <PawPrint className="h-4 w-4" /> Opciones del viaje
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="acceptsPets" className="flex items-center gap-2 text-sm">
                    <PawPrint className="h-4 w-4 text-accent" /> Acepto mascotas
                  </Label>
                  <Switch id="acceptsPets" checked={form.acceptsPets} onCheckedChange={v => setForm({ ...form, acceptsPets: v, petSizesAccepted: v ? form.petSizesAccepted : [] })} />
                </div>

                {form.acceptsPets && (
                  <div className="ml-6 space-y-2">
                    <Label className="text-[10px] text-muted-foreground block">¿Qué tamaños aceptás?</Label>
                    <div className="flex gap-3">
                      {PET_SIZES.map(s => (
                        <label key={s.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <Checkbox checked={form.petSizesAccepted.includes(s.value)} onCheckedChange={() => togglePetSize(s.value)} />
                          {s.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="hasPet" className="flex items-center gap-2 text-sm">
                    <PawPrint className="h-4 w-4 text-primary" /> Viajo con mi mascota
                  </Label>
                  <Switch id="hasPet" checked={form.hasPet} onCheckedChange={v => setForm({ ...form, hasPet: v, petSize: v ? form.petSize : '' })} />
                </div>

                {form.hasPet && (
                  <div className="ml-6">
                    <Label className="text-[10px] text-muted-foreground mb-1 block">Tamaño de tu mascota</Label>
                    <Select value={form.petSize} onValueChange={v => setForm({ ...form, petSize: v })}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Seleccioná el tamaño" /></SelectTrigger>
                      <SelectContent>
                        {PET_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="allowsLuggage" className="flex items-center gap-2 text-sm">
                    <Luggage className="h-4 w-4 text-primary" /> Permito equipaje grande
                  </Label>
                  <Switch id="allowsLuggage" checked={form.allowsLuggage} onCheckedChange={v => setForm({ ...form, allowsLuggage: v })} />
                </div>
              </div>

              {/* Extras badges */}
              <div className="pt-1">
                <div className="flex flex-wrap gap-2">
                  {EXTRA_BADGES.map(b => {
                    const Icon = b.icon;
                    const active = extras.includes(b.key);
                    return (
                      <button
                        type="button"
                        key={b.key}
                        onClick={() => toggleExtra(b.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                          active
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card text-foreground border-border hover:border-primary/40'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <Label className="text-[11px] text-muted-foreground mb-2 block">Observaciones (opcional)</Label>
              <div className="relative">
                <Pencil className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Textarea
                  placeholder="Ej: Salgo puntual, paso por autopista, acepto mascotas chicas, etc."
                  value={form.observations}
                  onChange={e => setForm({ ...form, observations: e.target.value.slice(0, 200) })}
                  className="rounded-xl resize-none pl-10 min-h-[88px]"
                  rows={3}
                  maxLength={200}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-right mt-1">{form.observations.length}/200</p>
            </div>

            {/* Safety notice */}
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-[12px] leading-relaxed">
                <p className="font-semibold text-primary">Consejo de seguridad</p>
                <p className="text-muted-foreground">No compartas datos personales (teléfono, dirección, etc.) en las observaciones. WEEGO te mantiene seguro.</p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-base font-semibold gap-2 shadow-lg"
            >
              <Car className="h-5 w-5" /> {loading ? 'Publicando...' : 'Publicar viaje'}
            </Button>
          </form>
        </motion.div>
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default PublishTrip;
