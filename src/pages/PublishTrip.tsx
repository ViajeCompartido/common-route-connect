import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, PawPrint, Luggage, Car, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const PublishTrip = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    origin: '', destination: '', date: '', time: '',
    totalSeats: '4', pricePerSeat: '',
    acceptsPets: false, hasPet: false, allowsLuggage: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('¡Listo! Tu viaje ya está publicado. Los pasajeros lo van a poder encontrar en la búsqueda.');
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
          <p className="text-sm text-primary-foreground/70">Cargá los datos de tu próximo viaje y encontrá pasajeros para compartir gastos.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2 space-y-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Info card */}
          <div className="bg-accent/10 rounded-2xl p-4 flex items-start gap-2.5 mb-3">
            <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tu viaje va a aparecer en las búsquedas. Cuando un pasajero pida un lugar, te llega la solicitud y vos decidís si aceptás o no.
            </p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-4">Datos del viaje</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                <Input placeholder="¿De dónde salís?" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} className="pl-10 h-12 rounded-xl" required />
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
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Hora de salida</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Lugares disponibles</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" min="1" max="6" value={form.totalSeats} onChange={e => setForm({ ...form, totalSeats: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground mb-1 block">Precio por asiento</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="Ej: 3000" value={form.pricePerSeat} onChange={e => setForm({ ...form, pricePerSeat: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                  </div>
                </div>
              </div>

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

              <Button type="submit" className="w-full h-12 gradient-accent text-primary-foreground rounded-xl text-sm font-semibold gap-2">
                <Car className="h-4 w-4" /> Publicar viaje
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
