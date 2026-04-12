import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, MessageCircle, CreditCard, Star, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { mockBookings } from '@/data/mockData';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', icon: Clock },
  accepted: { label: 'Aceptado', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30', icon: CheckCircle2 },
  coordinating: { label: 'Coordinando', color: 'bg-primary/15 text-primary border-primary/30', icon: MessageCircle },
  paid: { label: 'Pagado', color: 'bg-accent/15 text-accent border-accent/30', icon: CreditCard },
  completed: { label: 'Completado', color: 'bg-green-500/15 text-green-700 border-green-500/30', icon: CheckCircle2 },
  cancelled_passenger: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  cancelled_driver: { label: 'Cancelado por chofer', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  rejected: { label: 'Rechazado', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};

const MyTrips = () => {
  const navigate = useNavigate();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const active = mockBookings.filter(b => ['pending', 'accepted', 'coordinating', 'paid'].includes(b.status));
  const past = mockBookings.filter(b => ['completed', 'cancelled_passenger', 'cancelled_driver', 'rejected'].includes(b.status));

  const handleCancel = (id: string) => {
    setCancellingId(id);
    toast.success('Reserva cancelada. Se notificó al chofer.');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Mis viajes</h1>
          <p className="text-sm text-primary-foreground/70">Tus reservas activas y tu historial.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Tabs defaultValue="active">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">Activos ({active.length})</TabsTrigger>
            <TabsTrigger value="past">Historial ({past.length})</TabsTrigger>
          </TabsList>

          {[{ key: 'active', bookings: active }, { key: 'past', bookings: past }].map(({ key, bookings }) => (
            <TabsContent key={key} value={key} className="space-y-3">
              {bookings.map((b, i) => {
                const sc = statusConfig[b.status];
                const StatusIcon = sc.icon;
                const cancelled = cancellingId === b.id;
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className={`bg-card rounded-2xl p-4 border border-border ${cancelled ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm font-heading">{b.origin} → {b.destination}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {b.date} · {b.time}hs
                          </p>
                        </div>
                        <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" /> {cancelled ? 'Cancelado' : sc.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>Chofer: <span className="font-medium text-foreground">{b.driverName}</span></span>
                        <span className="font-heading font-bold text-primary">${(b.pricePerSeat * b.seats).toLocaleString()}</span>
                      </div>

                      {!cancelled && key === 'active' && (
                        <div className="flex gap-2">
                          {b.status === 'coordinating' && (
                            <Button size="sm" className="flex-1 h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate(`/chat/${b.tripId}?phase=coordination`)}>
                              <MessageCircle className="h-3 w-3" /> Coordinar
                            </Button>
                          )}
                          {b.status === 'paid' && (
                            <Button size="sm" className="flex-1 h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate(`/chat/${b.tripId}`)}>
                              <MessageCircle className="h-3 w-3" /> Chatear
                            </Button>
                          )}
                          {['pending', 'accepted', 'coordinating'].includes(b.status) && (
                            <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs text-destructive border-destructive/30" onClick={() => handleCancel(b.id)}>
                              <XCircle className="h-3 w-3" /> Cancelar
                            </Button>
                          )}
                        </div>
                      )}

                      {key === 'past' && b.status === 'completed' && (
                        <Button size="sm" variant="outline" className="w-full h-9 rounded-xl gap-1 text-xs" onClick={() => navigate('/rate')}>
                          <Star className="h-3 w-3" /> Calificar
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No tenés viajes {key === 'active' ? 'activos' : 'anteriores'}.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default MyTrips;
