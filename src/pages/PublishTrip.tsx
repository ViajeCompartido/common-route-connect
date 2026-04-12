import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, PawPrint, Luggage } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
    toast.success('¡Viaje publicado exitosamente!');
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Publicar viaje</h1>
          <p className="text-sm text-primary-foreground/70">Compartí tu próximo viaje y dividí gastos.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
                <Input placeholder="Origen" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} className="pl-10" required />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input placeholder="Destino" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} className="pl-10" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="pl-10" required />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="pl-10" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" min="1" max="6" placeholder="Lugares" value={form.totalSeats} onChange={e => setForm({ ...form, totalSeats: e.target.value })} className="pl-10" required />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="Precio/asiento" value={form.pricePerSeat} onChange={e => setForm({ ...form, pricePerSeat: e.target.value })} className="pl-10" required />
                </div>
              </div>

              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="acceptsPets" className="flex items-center gap-2 text-sm">
                    <PawPrint className="h-4 w-4" /> Acepto mascotas
                  </Label>
                  <Switch id="acceptsPets" checked={form.acceptsPets} onCheckedChange={v => setForm({ ...form, acceptsPets: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="hasPet" className="flex items-center gap-2 text-sm">
                    <PawPrint className="h-4 w-4" /> Viajo con mascota propia
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

              <Button type="submit" className="w-full gradient-accent text-primary-foreground">
                Publicar viaje
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default PublishTrip;
