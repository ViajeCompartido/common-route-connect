import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, BadgeCheck, Sparkles, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RideRequestRow {
  id: string; passenger_id: string; origin: string; destination: string;
  date: string; time: string; seats: number; has_pet: boolean; pet_size: string | null;
  has_luggage: boolean; message: string | null; status: string;
  passengerName: string; passengerRating: number; passengerTrips: number; passengerVerified: boolean;
}

const PET_SIZE_LABELS: Record<string, string> = { small: 'Chica', medium: 'Mediana', large: 'Grande' };

function isExpired(date: string, time: string): boolean {
  try { return new Date(`${date}T${time}`).getTime() < Date.now(); } catch { return false; }
}

const CompatiblePassengers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState<RideRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('ride_requests').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (error || !data) { setLoading(false); return; }

    const filtered = data.filter(r => r.passenger_id !== user?.id && !isExpired(r.date, r.time));
    if (filtered.length === 0) { setRequests([]); setLoading(false); return; }

    const passengerIds = [...new Set(filtered.map(r => r.passenger_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name, average_rating, total_trips, verified').in('id', passengerIds);
    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

    setRequests(filtered.map(r => {
      const p = profileMap.get(r.passenger_id);
      return { ...r, passengerName: p ? `${p.first_name} ${p.last_name}`.trim() || 'Pasajero' : 'Pasajero', passengerRating: p?.average_rating ?? 0, passengerTrips: p?.total_trips ?? 0, passengerVerified: p?.verified ?? false };
    }));
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70"><ArrowLeft className="h-4 w-4" /> Volver</button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Pasajeros que buscan viaje</h1>
          <p className="text-sm text-primary-foreground/70">Personas que publicaron su necesidad de traslado.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <div className="bg-accent/10 rounded-2xl p-3 flex items-start gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">Revisá las publicaciones de pasajeros y ofrecete si tu ruta y horario son compatibles.</p>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando...</p></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">No hay pasajeros buscando viaje en este momento.</p></div>
        ) : requests.map((req, i) => (
          <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="bg-card rounded-2xl p-5 border border-accent/30">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-full">Pasajero busca viaje</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center text-accent font-heading font-bold shrink-0">{req.passengerName.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold font-heading text-sm">{req.passengerName}</span>
                    {req.passengerVerified && <BadgeCheck className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={req.passengerRating} size="sm" />
                    <span className="text-xs font-bold">{req.passengerRating}</span>
                    <span className="text-[10px] text-muted-foreground">· {req.passengerTrips} viajes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm"><MapPin className="h-3.5 w-3.5 text-accent shrink-0" /><span>{req.origin} → {req.destination}</span></div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.date} · {req.time}hs</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {req.seats} lugar{req.seats > 1 ? 'es' : ''}</span>
                </div>
                <div className="flex gap-2">
                  {req.has_pet && <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5"><PawPrint className="h-3 w-3" /> Mascota {req.pet_size ? `(${PET_SIZE_LABELS[req.pet_size] || req.pet_size})` : ''}</Badge>}
                  {req.has_luggage && <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5"><Luggage className="h-3 w-3" /> Equipaje</Badge>}
                </div>
              </div>

              {req.message && <p className="text-xs text-muted-foreground italic mb-3">"{req.message}"</p>}

              <Button className="w-full h-11 rounded-xl gap-1.5 text-sm bg-accent/15 text-accent hover:bg-accent/25 border border-accent/30" variant="outline" onClick={() => toast.info('Próximamente podrás invitar pasajeros a tu viaje.')}>
                <Car className="h-4 w-4" /> Ofrecerme como chofer
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default CompatiblePassengers;
