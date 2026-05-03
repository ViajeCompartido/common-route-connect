import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Calendar, Clock, Users, PawPrint, Luggage, ArrowRight, Info, Coffee, Music, Snowflake, Cigarette, Pencil } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LocationInput from '@/components/LocationInput';
import BottomNav from '@/components/BottomNav';
import SideMenu from '@/components/SideMenu';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { normalizeLocation } from '@/lib/normalizeLocation';
import { isTripCreationValid } from '@/lib/tripUtils';
import heroImg from '@/assets/need-ride-hero.jpg';

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

const EXTRAS = [
  { key: 'mate', label: 'Llevo mate', icon: Coffee },
  { key: 'music', label: 'Música', icon: Music },
  { key: 'air', label: 'Aire acondicionado', icon: Snowflake },
  { key: 'no_smoke', label: 'No fumar', icon: Cigarette },
];

const MAX_SEATS = 4;

const NeedRide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProfileComplete, loading: profileLoading } = useProfile();
  const { totalUnread } = useUnreadMessages();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    seats: 1, hasPet: false, petSize: '', hasLuggage: false, message: '',
  });

  useEffect(() => {
    if (!profileLoading && !isProfileComplete) {
      toast.error('Completá tu perfil para continuar.');
      navigate('/edit-profile');
    }
  }, [profileLoading, isProfileComplete]);

  const toggleExtra = (k: string) =>
    setExtras(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Tenés que iniciar sesión primero.'); return; }
    if (form.hasPet && !form.petSize) { toast.error('Indicá el tamaño de tu mascota.'); return; }
    if (!isTripCreationValid(form.date, form.time)) {
      toast.error('La fecha y hora tienen que ser futuras.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('ride_requests').insert({
      passenger_id: user.id,
      origin: normalizeLocation(form.origin),
      destination: normalizeLocation(form.destination),
      date: form.date,
      time: form.time,
      seats: form.seats,
      has_pet: form.hasPet,
      pet_size: form.hasPet ? form.petSize : null,
      has_luggage: form.hasLuggage,
      message: form.message || null,
      status: 'active',
    }).select('id, status').single();
    setLoading(false);

    if (error) { toast.error('No pudimos publicar tu necesidad.'); console.error(error); return; }
    toast.success('¡Listo! Tu búsqueda está publicada.');
    navigate('/my-trips', { state: { highlightRequestId: data.id } });
  };

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando...</p></div>;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />

      {/* HERO */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img src={heroImg} alt="Persona esperando un viaje al costado de la ruta" className="absolute inset-0 w-full h-full object-cover" />
        {/* Green gradient overlay left -> right */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.92) 0%, hsl(var(--primary) / 0.55) 45%, transparent 80%)' }}
        />
        {/* Soft bottom fade for card overlap */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background" />

        {/* Top icons */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-4">
          <button aria-label="Abrir menú" onClick={() => setMenuOpen(true)} className="p-2 text-primary-foreground active:opacity-70">
            <Menu className="h-6 w-6" />
          </button>
          <button aria-label="Notificaciones" onClick={() => navigate('/notifications')} className="p-2 relative text-primary-foreground active:opacity-70">
            <Bell className="h-6 w-6" />
            {totalUnread > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />}
          </button>
        </div>

        {/* Title */}
        <div className="relative z-10 px-5 mt-4 max-w-[70%]">
          <h1 className="text-3xl font-heading font-bold text-primary-foreground leading-tight">Necesito viajar</h1>
          <p className="text-sm text-primary-foreground/90 mt-2 leading-snug">
            Publicá tu viaje y encontrá choferes compatibles.
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="px-4 -mt-10 relative z-10">
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl shadow-xl border border-border/50 p-5 space-y-5"
        >
          {/* Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">¿Desde dónde salís?</Label>
              <LocationInput value={form.origin} onChange={v => setForm({ ...form, origin: v })} placeholder="Ej: Córdoba" iconColor="text-primary" required />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">¿A dónde vas?</Label>
              <LocationInput value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="Ej: Buenos Aires" iconColor="text-primary" required />
            </div>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Fecha</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="pl-10 h-12 rounded-xl" required />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Hora aproximada</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10 h-12 rounded-xl" required />
              </div>
            </div>
          </div>

          {/* Seats */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">¿Cuántas personas viajan? (máx. 4)</Label>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="grid grid-cols-4 gap-2 flex-1">
                {[1, 2, 3, 4].map(n => {
                  const active = form.seats === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm({ ...form, seats: n })}
                      className={`h-12 rounded-xl border-2 text-sm font-semibold transition-all ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-card text-foreground border-primary/40 hover:border-primary'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-primary/10 rounded-xl p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80 leading-relaxed">
              No hace falta que coincida exacto. Te mostramos choferes cercanos a tu ruta y horario.
            </p>
          </div>

          {/* Trip Options */}
          <div>
            <Label className="text-sm font-semibold mb-2.5 block">Opciones del viaje</Label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {EXTRAS.map(({ key, label, icon: Icon }) => {
                const active = extras.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleExtra(key)}
                    className={`flex items-center gap-2 px-3 h-12 rounded-xl border-2 transition-all text-left ${
                      active
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border text-foreground hover:border-primary/40'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-primary/70'}`} />
                    <span className="text-xs font-medium leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center justify-between px-3 h-12 rounded-xl border border-border bg-card">
                <Label htmlFor="hasPet" className="flex items-center gap-2 text-sm cursor-pointer">
                  <PawPrint className="h-4 w-4 text-primary" /> Viajo con mascota
                </Label>
                <Switch id="hasPet" checked={form.hasPet} onCheckedChange={v => setForm({ ...form, hasPet: v, petSize: v ? form.petSize : '' })} />
              </div>
              <div className="flex items-center justify-between px-3 h-12 rounded-xl border border-border bg-card">
                <Label htmlFor="hasLuggage" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Luggage className="h-4 w-4 text-primary" /> Llevo equipaje grande
                </Label>
                <Switch id="hasLuggage" checked={form.hasLuggage} onCheckedChange={v => setForm({ ...form, hasLuggage: v })} />
              </div>
            </div>

            {form.hasPet && (
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground mb-1 block">Tamaño de tu mascota</Label>
                <Select value={form.petSize} onValueChange={v => setForm(p => ({ ...p, petSize: v }))}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seleccioná el tamaño" /></SelectTrigger>
                  <SelectContent>
                    {PET_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Observaciones <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <div className="relative">
              <Pencil className="absolute left-3 top-3.5 h-4 w-4 text-primary" />
              <Textarea
                placeholder="Contanos algo más sobre tu viaje..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                className="pl-10 rounded-xl resize-none min-h-[52px]"
                rows={2}
              />
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-base font-semibold gap-2 shadow-md">
            {loading ? 'Publicando...' : <>Buscar viaje <ArrowRight className="h-5 w-5" /></>}
          </Button>
        </motion.form>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default NeedRide;
