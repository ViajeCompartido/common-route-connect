import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, PawPrint, Luggage, Send, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LocationInput from '@/components/LocationInput';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { normalizeLocation } from '@/lib/normalizeLocation';
import { isTripCreationValid } from '@/lib/tripUtils';

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

const NeedRide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProfileComplete, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    seats: '1', hasPet: false, petSize: '', hasLuggage: false, message: '',
  });

  useEffect(() => {
    if (!profileLoading && !isProfileComplete) {
      toast.error('Completá tu perfil para continuar.');
      navigate('/edit-profile');
    }
  }, [profileLoading, isProfileComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Tenés que iniciar sesión primero.'); return; }
    if (form.hasPet && !form.petSize) { toast.error('Indicá el tamaño de tu mascota.'); return; }
    if (!isTripCreationValid(form.date, form.time)) {
      toast.error('La fecha y hora de la solicitud tienen que ser futuras para que permanezca visible.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.from('ride_requests').insert({
      passenger_id: user.id,
      origin: normalizeLocation(form.origin),
      destination: normalizeLocation(form.destination),
      date: form.date,
      time: form.time,
      seats: parseInt(form.seats),
      has_pet: form.hasPet,
      pet_size: form.hasPet ? form.petSize : null,
      has_luggage: form.hasLuggage,
      message: form.message || null,
      status: 'active',
    }).select('id, status').single();
    setLoading(false);

    if (error) { toast.error('No pudimos publicar tu necesidad. Intentá de nuevo.'); console.error(error); return; }
    if (!data?.id || data.status !== 'active') {
      toast.error('La solicitud se creó con un estado inesperado. Revisala en Mis viajes.');
      return;
    }
    toast.success('¡Listo! Tu búsqueda está publicada.');
    navigate('/my-trips', { state: { highlightRequestId: data.id } });
  };

  if (profileLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando...</p></div>;

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70"><ArrowLeft className="h-4 w-4" /> Volver</button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Necesito viajar</h1>
          <p className="text-sm text-primary-foreground/70">Publicá tu necesidad y encontrá choferes compatibles.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2 space-y-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-accent/10 rounded-2xl p-4 flex items-start gap-2.5 mb-3">
            <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">No hace falta que coincida exacto. Te mostramos choferes que pasan por tu zona, en horarios cercanos y con el mismo destino.</p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-4">¿A dónde necesitás ir?</h3>
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
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Horario aproximado</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">¿Cuántas personas viajan?</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" min="1" max="6" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} className="pl-10 h-12 rounded-xl" />
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasPet" className="flex items-center gap-2 text-sm"><PawPrint className="h-4 w-4 text-accent" /> Viajo con mascota</Label>
                  <Switch id="hasPet" checked={form.hasPet} onCheckedChange={v => setForm({ ...form, hasPet: v, petSize: v ? form.petSize : '' })} />
                </div>

                {form.hasPet && (
                  <div className="ml-6">
                    <Label className="text-[10px] text-muted-foreground mb-1 block">Tamaño de tu mascota</Label>
                    <Select value={form.petSize} onValueChange={v => setForm(prev => ({ ...prev, petSize: v }))}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Seleccioná el tamaño" /></SelectTrigger>
                      <SelectContent>
                        {PET_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="hasLuggage" className="flex items-center gap-2 text-sm"><Luggage className="h-4 w-4" /> Llevo equipaje grande</Label>
                  <Switch id="hasLuggage" checked={form.hasLuggage} onCheckedChange={v => setForm({ ...form, hasLuggage: v })} />
                </div>
              </div>

              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Mensaje para el chofer (opcional)</Label>
                <Textarea placeholder="Ej: Puedo acercarme a cualquier punto accesible en auto..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="rounded-xl resize-none" rows={3} />
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl text-sm font-semibold gap-2">
                <Send className="h-4 w-4" /> {loading ? 'Publicando...' : 'Publicar mi necesidad de viaje'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default NeedRide;
