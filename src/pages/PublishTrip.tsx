import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, PawPrint, Luggage, Car, Info, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import BottomNav from '@/components/BottomNav';
import { routePriceRanges } from '@/data/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PublishTrip = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [maxVehicleSeats, setMaxVehicleSeats] = useState(4);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    totalSeats: '4', pricePerSeat: '',
    acceptsPets: false, hasPet: false, allowsLuggage: true,
    observations: '',
  });

  // Fetch driver's max seats from their profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from('driver_profiles')
      .select('max_seats')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setMaxVehicleSeats(data.max_seats);
          setForm(f => ({ ...f, totalSeats: String(data.max_seats) }));
        }
      });
  }, [user]);

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

    setLoading(true);
    const totalSeats = parseInt(form.totalSeats);
    const { error } = await supabase.from('trips').insert({
      driver_id: user.id,
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      time: form.time,
      total_seats: totalSeats,
      available_seats: totalSeats,
      price_per_seat: parseInt(form.pricePerSeat),
      accepts_pets: form.acceptsPets,
      has_pet: form.hasPet,
      allows_luggage: form.allowsLuggage,
      observations: form.observations || null,
      status: 'active',
    });
    setLoading(false);

    if (error) {
      toast.error('No pudimos publicar el viaje. Intentá de nuevo.');
      console.error(error);
      return;
    }
    toast.success('¡Listo! Tu viaje ya está publicado.');
    navigate('/');
  };

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
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                <Input placeholder="Zona o barrio de salida" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} className="pl-10 h-12 rounded-xl" required />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input placeholder="¿A dónde vas?" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="pl-10 h-12 rounded-xl" required />
              </div>
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
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Lugares disponibles (máx. {maxVehicleSeats})</Label>
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
                  <Switch id="acceptsPets" checked={form.acceptsPets} onCheckedChange={v => setForm({ ...form, acceptsPets: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasPet" className="flex items-center gap-2 text-sm">
                    <PawPrint className="h-4 w-4 text-ocean-light" /> Viajo con mi mascota
                  </Label>
                  <Switch id="hasPet" checked={form.hasPet} onCheckedChange={v => setForm({ ...form, hasPet: v })} />
                </div>
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
