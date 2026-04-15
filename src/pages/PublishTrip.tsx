import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, PawPrint, Luggage, Car, Info, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import LocationInput from '@/components/LocationInput';
import { normalizeLocation } from '@/lib/normalizeLocation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import { routePriceRanges } from '@/data/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Checkbox } from '@/components/ui/checkbox';

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

const PublishTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, driverProfile, isDriver, isProfileComplete, isDriverProfileComplete, loading: profileLoading } = useProfile();
  const [maxVehicleSeats, setMaxVehicleSeats] = useState(4);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    totalSeats: '4', pricePerSeat: '',
    acceptsPets: false, petSizesAccepted: [] as string[],
    hasPet: false, petSize: '',
    allowsLuggage: true,
    observations: '',
  });

  useEffect(() => {
    if (driverProfile) {
      setMaxVehicleSeats(driverProfile.max_seats);
      setForm(f => ({
        ...f,
        totalSeats: String(driverProfile.max_seats),
        acceptsPets: driverProfile.accepts_pets,
        petSizesAccepted: driverProfile.pet_sizes_accepted || [],
      }));
    }
  }, [driverProfile]);

  // Redirect if not a driver
  useEffect(() => {
    if (!profileLoading && !isDriver) {
      toast.error('Activá tu perfil de chofer para publicar viajes.');
      navigate('/activate-driver');
    }
  }, [profileLoading, isDriver]);

  // Check profile completeness
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setLoading(true);
    const totalSeats = parseInt(form.totalSeats);
    const { error } = await supabase.from('trips').insert({
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
      observations: form.observations || null,
      status: 'active',
    });

    // Also update driver profile with pet preferences
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
    toast.success('¡Listo! Tu viaje ya está publicado.');
    navigate('/');
  };

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando...</p></div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Car className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-heading font-bold text-primary-foreground">Publicar un viaje</h1>
          </div>
          <p className="text-sm text-primary-foreground/70">Cargá los datos y encontrá pasajeros compatibles.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2 space-y-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-accent/10 rounded-2xl p-4 flex items-start gap-2.5 mb-3">
            <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tu viaje aparece en las búsquedas mientras tenga lugares disponibles. Podés pausarlo o cerrarlo en cualquier momento desde "Mis viajes".
            </p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-4">Datos del viaje</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <LocationInput value={form.origin} onChange={v => setForm({ ...form, origin: v })} placeholder="¿Desde dónde salís?" iconColor="text-accent" required />
              <LocationInput value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="¿A dónde vas?" iconColor="text-primary" required />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Fecha</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Hora aproximada</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">¿Cuántos lugares ofrecés? (máx. {maxVehicleSeats})</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" min={1} max={maxVehicleSeats} value={form.totalSeats} onChange={e => setForm({ ...form, totalSeats: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Precio por asiento</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder={matchedRoute ? `Sugerido: $${matchedRoute.suggested.toLocaleString()}` : 'Ej: 3000'} value={form.pricePerSeat} onChange={e => setForm({ ...form, pricePerSeat: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
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
                      <div>
                        <p className="text-muted-foreground">
                          Precio sugerido: <span className="font-semibold text-foreground">${matchedRoute.suggested.toLocaleString()}</span> · Rango: ${matchedRoute.min.toLocaleString()} – ${matchedRoute.max.toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-4">
                <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider">Opciones del viaje</h3>

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
                    <PawPrint className="h-4 w-4 text-ocean-light" /> Viajo con mi mascota
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
                    <Luggage className="h-4 w-4" /> Permito equipaje grande
                  </Label>
                  <Switch id="allowsLuggage" checked={form.allowsLuggage} onCheckedChange={v => setForm({ ...form, allowsLuggage: v })} />
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Observaciones (opcional)</Label>
                <Textarea
                  placeholder="Ej: Salgo puntual, paso por autopista, acepto mascotas chicas..."
                  value={form.observations}
                  onChange={e => setForm({ ...form, observations: e.target.value })}
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl text-sm font-semibold gap-2">
                <Car className="h-4 w-4" /> {loading ? 'Publicando...' : 'Publicar viaje'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default PublishTrip;
