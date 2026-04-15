import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, MessageCircle, CreditCard, Star, XCircle, CheckCircle2, Users, PawPrint, Luggage, Pause, Play, Lock, Ban, Hand, Navigation, Flag, Pencil, AlertTriangle, Car, MapPinCheck, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LocationInput from '@/components/LocationInput';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { isTripExpired } from '@/lib/tripUtils';
import { normalizeLocation } from '@/lib/normalizeLocation';
import { calculatePriceBreakdown } from '@/lib/tripUtils';
import { getRefundInfo, CANCELLABLE_STATUSES } from '@/lib/cancellationPolicy';

interface BookingRow {
  id: string; trip_id: string; seats: number; status: string; price_per_seat: number;
  has_pet: boolean; has_luggage: boolean; pet_surcharge: number | null; created_at: string; driver_id: string;
  origin: string; destination: string; date: string; time: string; driverName: string;
}

interface TripRow {
  id: string; origin: string; destination: string; date: string; time: string;
  available_seats: number; total_seats: number; price_per_seat: number; status: string;
  accepts_pets: boolean; allows_luggage: boolean; created_at: string; observations: string | null;
}

interface RideRequestRow {
  id: string; origin: string; destination: string; date: string; time: string;
  seats: number; has_pet: boolean; has_luggage: boolean; pet_size: string | null;
  status: string; created_at: string; message: string | null;
}

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

const bookingStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', icon: Clock },
  accepted: { label: 'Aceptado', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30', icon: CheckCircle2 },
  coordinating: { label: 'Coordinando', color: 'bg-primary/15 text-primary border-primary/30', icon: MessageCircle },
  paid: { label: 'Pagado', color: 'bg-accent/15 text-accent border-accent/30', icon: CreditCard },
  driver_on_way: { label: 'Chofer en camino', color: 'bg-sky-500/15 text-sky-700 border-sky-500/30', icon: Car },
  driver_arrived: { label: 'Chofer llegó', color: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30', icon: MapPinCheck },
  in_transit: { label: 'En viaje', color: 'bg-violet-500/15 text-violet-700 border-violet-500/30', icon: Route },
  completed: { label: 'Completado', color: 'bg-green-500/15 text-green-700 border-green-500/30', icon: CheckCircle2 },
  cancelled_passenger: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  cancelled_driver: { label: 'Cancelado por chofer', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
  rejected: { label: 'Rechazado', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: XCircle },
};

const tripStatusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Activo', color: 'bg-green-500/15 text-green-700 border-green-500/30' },
  paused: { label: 'Pausado', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' },
  full: { label: 'Lleno', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30' },
  in_progress: { label: 'En curso', color: 'bg-sky-500/15 text-sky-700 border-sky-500/30' },
  completed: { label: 'Finalizado', color: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const MyTrips = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDriver } = useProfile();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [driverTrips, setDriverTrips] = useState<TripRow[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ booking: BookingRow; refund: ReturnType<typeof getRefundInfo> } | null>(null);

  // Edit dialogs
  const [editingTrip, setEditingTrip] = useState<TripRow | null>(null);
  const [editingRequest, setEditingRequest] = useState<RideRequestRow | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [bookingRes, tripsRes, requestsRes] = await Promise.all([
      supabase.from('bookings').select('*').eq('passenger_id', user.id).order('created_at', { ascending: false }),
      supabase.from('trips').select('*').eq('driver_id', user.id).order('created_at', { ascending: false }),
      supabase.from('ride_requests').select('*').eq('passenger_id', user.id).order('created_at', { ascending: false }),
    ]);

    const bookingData = bookingRes.data ?? [];
    if (bookingData.length > 0) {
      const tripIds = [...new Set(bookingData.map(b => b.trip_id))];
      const driverIds = [...new Set(bookingData.map(b => b.driver_id))];
      const [{ data: trips }, { data: profiles }] = await Promise.all([
        supabase.from('trips').select('id, origin, destination, date, time').in('id', tripIds),
        supabase.from('profiles').select('id, first_name, last_name').in('id', driverIds),
      ]);
      const tripMap = new Map((trips ?? []).map(t => [t.id, t]));
      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
      setBookings(bookingData.map(b => {
        const trip = tripMap.get(b.trip_id);
        const profile = profileMap.get(b.driver_id);
        return { ...b, origin: trip?.origin ?? '', destination: trip?.destination ?? '', date: trip?.date ?? '', time: trip?.time ?? '', driverName: profile ? `${profile.first_name} ${profile.last_name}`.trim() || 'Chofer' : 'Chofer' };
      }));
    } else { setBookings([]); }

    setDriverTrips((tripsRes.data ?? []) as TripRow[]);
    setRideRequests((requestsRes.data ?? []) as RideRequestRow[]);
    setLoading(false);
  };

  const promptCancelBooking = (b: BookingRow) => {
    const refund = getRefundInfo(b.status, b.date, b.time);
    if (!refund.canCancel) {
      toast.error('No podés cancelar este viaje en su estado actual.');
      return;
    }
    setCancelConfirm({ booking: b, refund });
  };

  const confirmCancelBooking = async () => {
    if (!cancelConfirm) return;
    const id = cancelConfirm.booking.id;
    setActionLoading(id);
    const { error } = await supabase.from('bookings').update({ status: 'cancelled_passenger' as any }).eq('id', id);
    setActionLoading(null);
    setCancelConfirm(null);
    if (error) { toast.error('Error al cancelar.'); return; }
    const pct = cancelConfirm.refund.percentage;
    toast.success(pct === 100 ? 'Reserva cancelada. Reembolso completo.' : `Reserva cancelada. Reembolso del ${pct}%.`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled_passenger' } : b));
  };

  const handleTripAction = async (tripId: string, newStatus: string) => {
    setActionLoading(tripId);
    const { error } = await supabase.from('trips').update({ status: newStatus as any }).eq('id', tripId);
    if (error) { setActionLoading(null); toast.error('Error al actualizar.'); return; }

    // Map trip status to booking progress statuses
    const bookingProgressMap: Record<string, string> = {
      in_progress: 'driver_on_way',
    };
    const bookingNewStatus = bookingProgressMap[newStatus];
    if (bookingNewStatus) {
      await supabase.from('bookings').update({ status: bookingNewStatus as any }).eq('trip_id', tripId).in('status', ['paid']);
    }

    if (newStatus === 'completed') {
      await supabase.from('bookings').update({ status: 'completed' as any }).eq('trip_id', tripId).in('status', ['paid', 'driver_on_way', 'driver_arrived', 'in_transit', 'coordinating', 'accepted']);
      const { data: tripBookings } = await supabase.from('bookings').select('id').eq('trip_id', tripId);
      if (tripBookings && tripBookings.length > 0) {
        const bookingIds = tripBookings.map(b => b.id);
        await supabase.from('payments').update({ status: 'held' as any }).in('booking_id', bookingIds).eq('status', 'completed' as any);
      }
    }

    setActionLoading(null);
    const msgs: Record<string, string> = { paused: 'Viaje pausado.', active: 'Viaje reactivado.', full: 'Viaje marcado como lleno.', cancelled: 'Viaje cerrado.', in_progress: 'En camino. Los pasajeros fueron notificados.', completed: 'Viaje finalizado. El pago queda retenido hasta ser liberado.' };
    toast.success(msgs[newStatus] || 'Actualizado.');
    setDriverTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: newStatus } : t));
  };

  const handleCancelRequest = async (id: string) => {
    setActionLoading(id);
    const { error } = await supabase.from('ride_requests').update({ status: 'cancelled' }).eq('id', id);
    setActionLoading(null);
    if (error) { toast.error('Error al cancelar.'); return; }
    toast.success('Solicitud cancelada.');
    setRideRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
  };

  // --- Edit trip ---
  const openEditTrip = (t: TripRow) => {
    setEditingTrip(t);
    setEditForm({
      origin: t.origin, destination: t.destination, date: t.date, time: t.time,
      available_seats: String(t.available_seats), price_per_seat: String(t.price_per_seat),
      accepts_pets: t.accepts_pets, allows_luggage: t.allows_luggage, observations: t.observations || '',
    });
  };

  const saveEditTrip = async () => {
    if (!editingTrip) return;
    setEditSaving(true);
    const { error } = await supabase.from('trips').update({
      origin: normalizeLocation(editForm.origin),
      destination: normalizeLocation(editForm.destination),
      date: editForm.date, time: editForm.time,
      available_seats: parseInt(editForm.available_seats),
      price_per_seat: parseInt(editForm.price_per_seat),
      accepts_pets: editForm.accepts_pets,
      allows_luggage: editForm.allows_luggage,
      observations: editForm.observations || null,
    }).eq('id', editingTrip.id);
    setEditSaving(false);
    if (error) { toast.error('Error al guardar.'); return; }
    toast.success('Viaje actualizado.');
    setEditingTrip(null);
    loadData();
  };

  // --- Edit ride request ---
  const openEditRequest = (r: RideRequestRow) => {
    setEditingRequest(r);
    setEditForm({
      origin: r.origin, destination: r.destination, date: r.date, time: r.time,
      seats: String(r.seats), has_pet: r.has_pet, pet_size: r.pet_size || '',
      has_luggage: r.has_luggage, message: r.message || '',
    });
  };

  const saveEditRequest = async () => {
    if (!editingRequest) return;
    setEditSaving(true);
    const { error } = await supabase.from('ride_requests').update({
      origin: normalizeLocation(editForm.origin),
      destination: normalizeLocation(editForm.destination),
      date: editForm.date, time: editForm.time,
      seats: parseInt(editForm.seats),
      has_pet: editForm.has_pet,
      pet_size: editForm.has_pet ? editForm.pet_size : null,
      has_luggage: editForm.has_luggage,
      message: editForm.message || null,
    }).eq('id', editingRequest.id);
    setEditSaving(false);
    if (error) { toast.error('Error al guardar.'); return; }
    toast.success('Solicitud actualizada.');
    setEditingRequest(null);
    loadData();
  };

  // Check if trip has active bookings (for warning)
  const hasActiveBookings = async (tripId: string): Promise<boolean> => {
    const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('trip_id', tripId).in('status', ['pending', 'accepted', 'coordinating', 'paid']);
    return (count ?? 0) > 0;
  };

  // --- Filtering with 30-min expiry ---
  const isItemExpired = (date: string, time: string) => isTripExpired(date, time);

  const activeBookings = bookings.filter(b =>
    ['pending', 'accepted', 'coordinating', 'paid', 'driver_on_way', 'driver_arrived', 'in_transit'].includes(b.status) && !isItemExpired(b.date, b.time)
  );
  const pastBookings = bookings.filter(b =>
    ['completed', 'cancelled_passenger', 'cancelled_driver', 'rejected'].includes(b.status) || isItemExpired(b.date, b.time)
  );
  const activeDriverTrips = driverTrips.filter(t =>
    ['active', 'paused', 'full', 'in_progress'].includes(t.status) && !isItemExpired(t.date, t.time)
  );
  const pastDriverTrips = driverTrips.filter(t =>
    ['completed', 'cancelled'].includes(t.status) || isItemExpired(t.date, t.time)
  );
  const activeRequests = rideRequests.filter(r => r.status === 'active' && !isItemExpired(r.date, r.time));
  const pastRequests = rideRequests.filter(r => r.status !== 'active' || isItemExpired(r.date, r.time));

  const totalActive = activeBookings.length + activeRequests.length;

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70"><ArrowLeft className="h-4 w-4" /> Volver</button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Mis viajes</h1>
          <p className="text-sm text-primary-foreground/70">Tus reservas, solicitudes y viajes publicados.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {loading ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando...</p></div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList className={`grid w-full mb-4 ${isDriver ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="active">Activos ({totalActive})</TabsTrigger>
              <TabsTrigger value="history">Historial ({pastBookings.length + pastRequests.length})</TabsTrigger>
              {isDriver && <TabsTrigger value="driver">Mis publicaciones ({activeDriverTrips.length})</TabsTrigger>}
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {activeRequests.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="bg-card rounded-2xl p-4 border border-accent/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Hand className="h-3.5 w-3.5 text-accent" />
                        <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">Busco viaje</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditRequest(r)}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    <p className="font-semibold text-sm font-heading">{r.origin} → {r.destination}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {r.date} · {r.time}hs</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span><Users className="h-3 w-3 inline" /> {r.seats} persona{r.seats > 1 ? 's' : ''}</span>
                      {r.has_pet && <span><PawPrint className="h-3 w-3 inline" /> Mascota</span>}
                      {r.has_luggage && <span><Luggage className="h-3 w-3 inline" /> Equipaje</span>}
                    </div>
                    <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs text-destructive border-destructive/30 mt-3"
                      disabled={actionLoading === r.id} onClick={() => handleCancelRequest(r.id)}>
                      <XCircle className="h-3 w-3" /> Cancelar
                    </Button>
                  </div>
                </motion.div>
              ))}

              {activeBookings.length === 0 && activeRequests.length === 0 ? (
                <div className="text-center py-12"><p className="text-muted-foreground text-sm">No tenés viajes activos.</p></div>
              ) : activeBookings.map((b, i) => {
                const sc = bookingStatusConfig[b.status] ?? bookingStatusConfig.pending;
                const StatusIcon = sc.icon;
                const breakdown = calculatePriceBreakdown(Number(b.price_per_seat), b.seats, Number(b.pet_surcharge) || 0);
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + activeRequests.length) * 0.04 }}>
                    <div className="bg-card rounded-2xl p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm font-heading">{b.origin} → {b.destination}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {b.date} · {b.time}hs</p>
                        </div>
                        <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${sc.color}`}><StatusIcon className="h-3 w-3" /> {sc.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Chofer: <span className="font-medium text-foreground">{b.driverName}</span></span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                        <div className="flex justify-between"><span>{b.seats} asiento{b.seats > 1 ? 's' : ''} × ${Number(b.price_per_seat).toLocaleString()}</span><span>${breakdown.basePrice.toLocaleString()}</span></div>
                        {breakdown.petSurcharge > 0 && <div className="flex justify-between"><span>Adicional mascota</span><span>+${breakdown.petSurcharge.toLocaleString()}</span></div>}
                        <div className="flex justify-between"><span>Cargo de servicio</span><span>+${breakdown.serviceFee.toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold text-foreground border-t border-border pt-1 mt-1"><span>Total</span><span className="text-primary">${breakdown.totalForPassenger.toLocaleString()}</span></div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {b.status === 'coordinating' && (
                          <Button size="sm" className="flex-1 h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate(`/chat/${b.trip_id}?phase=coordination`)}>
                            <MessageCircle className="h-3 w-3" /> Coordinar
                          </Button>
                        )}
                        {['paid', 'driver_on_way', 'driver_arrived', 'in_transit'].includes(b.status) && (
                          <Button size="sm" className="flex-1 h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate(`/chat/${b.trip_id}`)}>
                            <MessageCircle className="h-3 w-3" /> Chatear
                          </Button>
                        )}
                        {CANCELLABLE_STATUSES.includes(b.status) && (
                          <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs text-destructive border-destructive/30" disabled={actionLoading === b.id} onClick={() => promptCancelBooking(b)}>
                            <XCircle className="h-3 w-3" /> Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {pastRequests.map((r, i) => (
                <div key={r.id} className="bg-card rounded-2xl p-4 border border-border opacity-70">
                  <div className="flex items-center gap-1.5 mb-1"><Hand className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground uppercase">Busqué viaje</span></div>
                  <p className="font-semibold text-sm font-heading">{r.origin} → {r.destination}</p>
                  <p className="text-xs text-muted-foreground">{r.date} · {r.time}hs</p>
                </div>
              ))}
              {pastBookings.length === 0 && pastRequests.length === 0 ? (
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
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {b.date} · {b.time}hs</p>
                        </div>
                        <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${sc.color}`}><StatusIcon className="h-3 w-3" /> {sc.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Chofer: <span className="font-medium text-foreground">{b.driverName}</span></span>
                        <span className="font-heading font-bold text-primary">${(Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0)).toLocaleString()}</span>
                      </div>
                      {b.status === 'completed' && (
                        <Button size="sm" variant="outline" className="w-full h-9 rounded-xl gap-1 text-xs mt-3" onClick={() => navigate('/rate')}><Star className="h-3 w-3" /> Calificar</Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            {isDriver && (
              <TabsContent value="driver" className="space-y-3">
                {activeDriverTrips.length === 0 && pastDriverTrips.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">No publicaste viajes todavía.</p>
                    <Button size="sm" className="mt-3 rounded-xl gradient-accent text-primary-foreground" onClick={() => navigate('/publish')}>Publicar viaje</Button>
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
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {t.date} · {t.time}hs</p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {['active', 'paused'].includes(t.status) && (
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditTrip(t)}>
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </Button>
                                )}
                                <Badge className={`text-[10px] gap-1 rounded-full px-2 py-0.5 border ${ts.color}`}>{ts.label}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {t.available_seats}/{t.total_seats} lugares</span>
                              <span className="font-heading font-bold text-primary">${Number(t.price_per_seat).toLocaleString()}/asiento</span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" className="flex-1 h-9 rounded-xl gap-1 text-xs" onClick={() => navigate('/driver-requests')}>Solicitudes</Button>
                              {t.status === 'active' && (
                                <>
                                  <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'paused')}><Pause className="h-3 w-3" /> Pausar</Button>
                                  <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'full')}><Ban className="h-3 w-3" /> Lleno</Button>
                                </>
                              )}
                              {t.status === 'paused' && (
                                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'active')}><Play className="h-3 w-3" /> Reactivar</Button>
                              )}
                              {t.status === 'full' && (
                                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'active')}><Play className="h-3 w-3" /> Reabrir</Button>
                              )}
                              {['active', 'paused', 'full'].includes(t.status) && (
                                <Button size="sm" className="h-9 rounded-xl gap-1 text-xs gradient-ocean text-primary-foreground" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'in_progress')}><Car className="h-3 w-3" /> En camino</Button>
                              )}
                              {t.status === 'in_progress' && (
                                <>
                                  <Button size="sm" className="h-9 rounded-xl gap-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700" disabled={actionLoading === t.id} onClick={async () => {
                                    setActionLoading(t.id);
                                    await supabase.from('bookings').update({ status: 'driver_arrived' as any }).eq('trip_id', t.id).in('status', ['driver_on_way', 'paid']);
                                    setActionLoading(null);
                                    toast.success('Llegaste al punto de encuentro.');
                                  }}><MapPinCheck className="h-3 w-3" /> Llegué</Button>
                                  <Button size="sm" className="h-9 rounded-xl gap-1 text-xs bg-violet-600 text-white hover:bg-violet-700" disabled={actionLoading === t.id} onClick={async () => {
                                    setActionLoading(t.id);
                                    await supabase.from('bookings').update({ status: 'in_transit' as any }).eq('trip_id', t.id).in('status', ['driver_on_way', 'driver_arrived', 'paid']);
                                    setActionLoading(null);
                                    toast.success('Viaje iniciado.');
                                  }}><Route className="h-3 w-3" /> Iniciar viaje</Button>
                                  <Button size="sm" className="h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'completed')}><Flag className="h-3 w-3" /> Finalizar</Button>
                                </>
                              )}
                              {['active', 'paused', 'full'].includes(t.status) && (
                                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs text-destructive border-destructive/30" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'cancelled')}><Lock className="h-3 w-3" /> Cerrar</Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {pastDriverTrips.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-semibold pt-2">Finalizados</p>
                        {pastDriverTrips.map(t => {
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

      {/* Edit Trip Dialog */}
      <Dialog open={!!editingTrip} onOpenChange={(open) => !open && setEditingTrip(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar viaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Salida</Label>
              <LocationInput value={editForm.origin ?? ''} onChange={v => setEditForm((f: any) => ({ ...f, origin: v }))} placeholder="Desde" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Destino</Label>
              <LocationInput value={editForm.destination ?? ''} onChange={v => setEditForm((f: any) => ({ ...f, destination: v }))} placeholder="Hasta" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Fecha</Label>
                <Input type="date" value={editForm.date ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Hora</Label>
                <Input type="time" value={editForm.time ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, time: e.target.value }))} className="h-10 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Lugares disponibles</Label>
                <Input type="number" min={0} value={editForm.available_seats ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, available_seats: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Precio por asiento</Label>
                <Input type="number" value={editForm.price_per_seat ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, price_per_seat: e.target.value }))} className="h-10 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Acepta mascotas</Label>
              <Switch checked={editForm.accepts_pets ?? false} onCheckedChange={v => setEditForm((f: any) => ({ ...f, accepts_pets: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Permite equipaje</Label>
              <Switch checked={editForm.allows_luggage ?? false} onCheckedChange={v => setEditForm((f: any) => ({ ...f, allows_luggage: v }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Observaciones</Label>
              <Textarea value={editForm.observations ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, observations: e.target.value }))} className="rounded-xl resize-none" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTrip(null)}>Cancelar</Button>
            <Button onClick={saveEditTrip} disabled={editSaving} className="gradient-accent text-primary-foreground">{editSaving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar solicitud de viaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Salida</Label>
              <LocationInput value={editForm.origin ?? ''} onChange={v => setEditForm((f: any) => ({ ...f, origin: v }))} placeholder="Desde" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Destino</Label>
              <LocationInput value={editForm.destination ?? ''} onChange={v => setEditForm((f: any) => ({ ...f, destination: v }))} placeholder="Hasta" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Fecha</Label>
                <Input type="date" value={editForm.date ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, date: e.target.value }))} className="h-10 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Hora</Label>
                <Input type="time" value={editForm.time ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, time: e.target.value }))} className="h-10 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">¿Cuántas personas viajan?</Label>
              <Input type="number" min={1} max={6} value={editForm.seats ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, seats: e.target.value }))} className="h-10 rounded-xl" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1.5"><PawPrint className="h-4 w-4 text-accent" /> Viajo con mascota</Label>
              <Switch checked={editForm.has_pet ?? false} onCheckedChange={v => setEditForm((f: any) => ({ ...f, has_pet: v, pet_size: v ? f.pet_size : '' }))} />
            </div>
            {editForm.has_pet && (
              <Select value={editForm.pet_size ?? ''} onValueChange={v => setEditForm((f: any) => ({ ...f, pet_size: v }))}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Tamaño de mascota" /></SelectTrigger>
                <SelectContent>
                  {PET_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1.5"><Luggage className="h-4 w-4" /> Equipaje grande</Label>
              <Switch checked={editForm.has_luggage ?? false} onCheckedChange={v => setEditForm((f: any) => ({ ...f, has_luggage: v }))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Mensaje (opcional)</Label>
              <Textarea value={editForm.message ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, message: e.target.value }))} className="rounded-xl resize-none" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRequest(null)}>Cancelar</Button>
            <Button onClick={saveEditRequest} disabled={editSaving} className="gradient-accent text-primary-foreground">{editSaving ? 'Guardando...' : 'Guardar cambios'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav role="passenger" />
    </div>
  );
};

export default MyTrips;
