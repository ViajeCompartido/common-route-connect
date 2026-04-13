import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, MessageCircle, CreditCard, Star, XCircle, CheckCircle2, Users, PawPrint, Luggage, Pause, Play, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface BookingRow {
  id: string;
  trip_id: string;
  seats: number;
  status: string;
  price_per_seat: number;
  has_pet: boolean;
  has_luggage: boolean;
  pet_surcharge: number | null;
  created_at: string;
  driver_id: string;
  // enriched
  origin: string;
  destination: string;
  date: string;
  time: string;
  driverName: string;
}

interface TripRow {
  id: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  available_seats: number;
  total_seats: number;
  price_per_seat: number;
  status: string;
  accepts_pets: boolean;
  allows_luggage: boolean;
  created_at: string;
}

const bookingStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', icon: Clock },
  accepted: { label: 'Aceptado', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30', icon: CheckCircle2 },
  coordinating: { label: 'Coordinando', color: 'bg-primary/15 text-primary border-primary/30', icon: MessageCircle },
  paid: { label: 'Pagado', color: 'bg-accent/15 text-accent border-accent/30', icon: CreditCard },
  completed: { label: 'Completado', color: 'bg-green-500/15 text-green-700 border-green-500/30', icon: CheckCircle2 },
  cancelled_passenger: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  cancelled_driver: { label: 'Cancelado por chofer', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  rejected: { label: 'Rechazado', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};

const tripStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: 'bg-green-500/15 text-green-700 border-green-500/30' },
  paused: { label: 'Pausado', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  full: { label: 'Completo', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30' },
  completed: { label: 'Finalizado', color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const MyTrips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDriver } = useProfile();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [driverTrips, setDriverTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    // Load passenger bookings
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('passenger_id', user.id)
      .order('created_at', { ascending: false });

    if (bookingData && bookingData.length > 0) {
      // Enrich with trip + driver info
      const tripIds = [...new Set(bookingData.map(b => b.trip_id))];
      const driverIds = [...new Set(bookingData.map(b => b.driver_id))];

      const [{ data: trips }, { data: profiles }] = await Promise.all([
        supabase.from('trips').select('id, origin, destination, date, time').in('id', tripIds),
        supabase.from('profiles').select('id, first_name, last_name').in('id', driverIds),
      ]);

      const tripMap = new Map((trips ?? []).map(t => [t.id, t]));
      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      const enriched: BookingRow[] = bookingData.map(b => {
        const trip = tripMap.get(b.trip_id);
        const profile = profileMap.get(b.driver_id);
        return {
          ...b,
          origin: trip?.origin ?? '',
          destination: trip?.destination ?? '',
          date: trip?.date ?? '',
          time: trip?.time ?? '',
          driverName: profile ? `${profile.first_name} ${profile.last_name}`.trim() || 'Chofer' : 'Chofer',
        };
      });
      setBookings(enriched);
    } else {
      setBookings([]);
    }

    // Load driver trips if applicable
    const { data: myTrips } = await supabase
      .from('trips')
      .select('*')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: false });

    setDriverTrips((myTrips ?? []) as TripRow[]);
    setLoading(false);
  };

  const handleCancelBooking = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('bookings').update({ status: 'cancelled_passenger' }).eq('id', id);
    setActionLoading(null);
    if (error) { toast.error('Error al cancelar.'); return; }
    toast.success('Reserva cancelada.');
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled_passenger' } : b));
  };

  const handleTripAction = async (tripId: string, newStatus: string) => {
    setActionLoading(tripId);
    const { error } = await supabase.from('trips').update({ status: newStatus }).eq('id', tripId);
    setActionLoading(null);
    if (error) { toast.error('Error al actualizar el viaje.'); return; }
    toast.success(newStatus === 'paused' ? 'Viaje pausado.' : newStatus === 'active' ? 'Viaje reactivado.' : 'Viaje cerrado.');
    setDriverTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: newStatus } : t));
  };

  const activeBookings = bookings.filter(b => ['pending', 'accepted', 'coordinating', 'paid'].includes(b.status));
  const pastBookings = bookings.filter(b => ['completed', 'cancelled_passenger', 'cancelled_driver', 'rejected'].includes(b.status));
  const activeDriverTrips = driverTrips.filter(t => ['active', 'paused', 'full'].includes(t.status));
  const pastDriverTrips = driverTrips.filter(t => ['completed', 'cancelled'].includes(t.status));

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Mis viajes</h1>
          <p className="text-sm text-primary-foreground/70">Tus reservas y viajes publicados.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando...</p></div>
        ) : (
          <Tabs defaultValue="bookings">
            <TabsList className={`grid w-full mb-4 ${isDriver ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="bookings">Activos ({activeBookings.length})</TabsTrigger>
              <TabsTrigger value="history">Historial ({pastBookings.length})</TabsTrigger>
              {isDriver && <TabsTrigger value="driver">Mis publicaciones ({activeDriverTrips.length})</TabsTrigger>}
            </TabsList>

            {/* Active bookings as passenger */}
            <TabsContent value="bookings" className="space-y-3">
              {activeBookings.length === 0 ? (
                <div className="text-center py-12"><p className="text-muted-foreground text-sm">No tenés viajes activos.</p></div>
              ) : activeBookings.map((b, i) => {
                const sc = bookingStatusConfig[b.status] ?? bookingStatusConfig.pending;
                const StatusIcon = sc.icon;
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="bg-card rounded-2xl p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm font-heading">{b.origin} → {b.destination}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {b.date} · {b.time}hs
                          </p>
                        </div>
                        <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" /> {sc.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>Chofer: <span className="font-medium text-foreground">{b.driverName}</span></span>
                        <span className="font-heading font-bold text-primary">${(Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        {b.status === 'coordinating' && (
                          <Button size="sm" className="flex-1 h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate(`/chat/${b.trip_id}?phase=coordination`)}>
                            <MessageCircle className="h-3 w-3" /> Coordinar
                          </Button>
                        )}
                        {b.status === 'paid' && (
                          <Button size="sm" className="flex-1 h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate(`/chat/${b.trip_id}`)}>
                            <MessageCircle className="h-3 w-3" /> Chatear
                          </Button>
                        )}
                        {['pending', 'accepted', 'coordinating'].includes(b.status) && (
                          <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs text-destructive border-destructive/30"
                            disabled={actionLoading === b.id}
                            onClick={() => handleCancelBooking(b.id)}>
                            <XCircle className="h-3 w-3" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* Past bookings */}
            <TabsContent value="history" className="space-y-3">
              {pastBookings.length === 0 ? (
                <div className="text-center py-12"><p className="text-muted-foreground text-sm">No tenés viajes anteriores.</p></div>
              ) : pastBookings.map((b, i) => {
                const sc = bookingStatusConfig[b.status] ?? bookingStatusConfig.completed;
                const StatusIcon = sc.icon;
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="bg-card rounded-2xl p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm font-heading">{b.origin} → {b.destination}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" /> {b.date} · {b.time}hs
                          </p>
                        </div>
                        <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${sc.color}`}>
                          <StatusIcon className="h-3 w-3" /> {sc.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Chofer: <span className="font-medium text-foreground">{b.driverName}</span></span>
                        <span className="font-heading font-bold text-primary">${(Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0)).toLocaleString()}</span>
                      </div>
                      {b.status === 'completed' && (
                        <Button size="sm" variant="outline" className="w-full h-9 rounded-xl gap-1 text-xs mt-3" onClick={() => navigate('/rate')}>
                          <Star className="h-3 w-3" /> Calificar
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            {/* Driver's published trips */}
            {isDriver && (
              <TabsContent value="driver" className="space-y-3">
                {activeDriverTrips.length === 0 && pastDriverTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">No publicaste viajes todavía.</p>
                    <Button size="sm" className="mt-3 rounded-xl gradient-accent text-primary-foreground" onClick={() => navigate('/publish')}>
                      Publicar viaje
                    </Button>
                  </div>
                ) : (
                  <>
                    {activeDriverTrips.map((t, i) => {
                      const ts = tripStatusConfig[t.status] ?? tripStatusConfig.active;
                      return (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                          <div className="bg-card rounded-2xl p-4 border border-border">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm font-heading">{t.origin} → {t.destination}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" /> {t.date} · {t.time}hs
                                </p>
                              </div>
                              <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${ts.color}`}>
                                {ts.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t.available_seats}/{t.total_seats} lugares</span>
                              <span className="font-heading font-bold text-primary">${Number(t.price_per_seat).toLocaleString()}/asiento</span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl gap-1 text-xs"
                                onClick={() => navigate('/driver-requests')}>
                                Solicitudes
                              </Button>
                              {t.status === 'active' && (
                                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs"
                                  disabled={actionLoading === t.id}
                                  onClick={() => handleTripAction(t.id, 'paused')}>
                                  <Pause className="h-3 w-3" /> Pausar
                                </Button>
                              )}
                              {t.status === 'paused' && (
                                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs"
                                  disabled={actionLoading === t.id}
                                  onClick={() => handleTripAction(t.id, 'active')}>
                                  <Play className="h-3 w-3" /> Reactivar
                                </Button>
                              )}
                              {['active', 'paused'].includes(t.status) && (
                                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs text-destructive border-destructive/30"
                                  disabled={actionLoading === t.id}
                                  onClick={() => handleTripAction(t.id, 'cancelled')}>
                                  <Lock className="h-3 w-3" /> Cerrar
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {pastDriverTrips.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-semibold pt-2">Finalizados</p>
                        {pastDriverTrips.map((t, i) => {
                          const ts = tripStatusConfig[t.status] ?? tripStatusConfig.completed;
                          return (
                            <div key={t.id} className="bg-card rounded-2xl p-4 border border-border opacity-70">
                              <div className="flex items-start justify-between mb-1">
                                <p className="font-semibold text-sm font-heading">{t.origin} → {t.destination}</p>
                                <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${ts.color}`}>{ts.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{t.date} · {t.time}hs</p>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default MyTrips;
