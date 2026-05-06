import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, MessageCircle, CreditCard, Star, XCircle, CheckCircle2, Users, PawPrint, Luggage, Pause, Play, Lock, Ban, Hand, Navigation, Flag, Pencil, AlertTriangle, Car, MapPinCheck, Route, ArrowRight, Armchair, User as UserIcon, CalendarDays } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import heroRoad from '@/assets/hero-publish-road.jpg';
import weegoLogo from '@/assets/weego-logo.png';
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
import { getRefundInfo, CANCELLABLE_STATUSES, type RefundInfo } from '@/lib/cancellationPolicy';
import { formatPrice } from '@/lib/formatPrice';
import CancelBookingDialog from '@/components/CancelBookingDialog';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { clampSeatCount, getSeatSummary, MAX_DRIVER_VEHICLE_SEATS } from '@/lib/seatUtils';

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

interface DriverTripPassenger {
  booking_id: string;
  passenger_id: string;
  passenger_name: string;
  avatar_url: string | null;
  seats: number;
  status: string;
  payment_status: string;
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
  const location = useLocation();
  const { user } = useAuth();
  const { isDriver } = useProfile();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [driverTrips, setDriverTrips] = useState<TripRow[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ booking: BookingRow; refund: RefundInfo } | null>(null);
  const [cancelTripConfirm, setCancelTripConfirm] = useState<TripRow | null>(null);

  // Edit dialogs
  const [editingTrip, setEditingTrip] = useState<TripRow | null>(null);
  const [editingRequest, setEditingRequest] = useState<RideRequestRow | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editSaving, setEditSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'driver'>('active');

  const loadData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => { if (user) void loadData(); }, [user, loadData]);

  useEffect(() => {
    const state = location.state as { highlightTripId?: string; highlightRequestId?: string } | null;
    if (state?.highlightTripId && isDriver) {
      setActiveTab('driver');
      window.history.replaceState({}, document.title);
      return;
    }
    if (state?.highlightRequestId) {
      setActiveTab('active');
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isDriver]);

  useRealtimeRefresh({
    enabled: !!user,
    tables: ['bookings', 'trips', 'ride_requests', 'payments'],
    onChange: loadData,
    channelName: `my-trips-refresh-${user?.id ?? 'anon'}`,
  });

  const promptCancelBooking = (b: BookingRow) => {
    const refund = getRefundInfo(b.status, b.date, b.time);
    if (!refund.canCancel) {
      toast.error('No podés cancelar este viaje en su estado actual.');
      return;
    }
    setCancelConfirm({ booking: b, refund });
  };

  const handlePayBooking = async (bookingId: string) => {
    const actionKey = `pay-${bookingId}`;
    setActionLoading(actionKey);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { booking_id: bookingId },
      });

      if (error) throw error;
      if (data?.init_point) {
        window.location.href = data.init_point;
        return;
      }

      toast.error('No se pudo generar el link de pago.');
    } catch (error) {
      console.error(error);
      toast.error('Error al iniciar el pago. Intentá de nuevo.');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmCancelBooking = async (reason: string, category: string) => {
    if (!cancelConfirm) return;
    const id = cancelConfirm.booking.id;
    setActionLoading(id);
    const { data, error } = await supabase.rpc('cancel_booking' as any, {
      _booking_id: id,
      _reason: reason,
      _reason_category: category,
    });
    setActionLoading(null);
    if (error) { toast.error(error.message || 'Error al cancelar.'); return; }
    setCancelConfirm(null);
    const result: any = data;
    const pct = result?.refund_percentage ?? cancelConfirm.refund.percentage;
    const amount = result?.refund_amount ? formatPrice(Number(result.refund_amount)) : null;
    if (pct === 100) toast.success('Reserva cancelada. Reembolso completo.');
    else if (pct > 0) toast.success(`Reserva cancelada. Reembolso del ${pct}%${amount ? ` (${amount})` : ''}. Quedará pendiente hasta procesarse.`);
    else toast.success('Reserva cancelada. Sin reembolso aplicable.');
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled_passenger' } : b));
  };

  const confirmCancelTripAsDriver = async (reason: string, _category: string) => {
    if (!cancelTripConfirm) return;
    const tripId = cancelTripConfirm.id;
    setActionLoading(tripId);
    const { error } = await supabase.rpc('cancel_trip_as_driver' as any, {
      _trip_id: tripId, _reason: reason,
    });
    setActionLoading(null);
    if (error) { toast.error(error.message || 'Error al cancelar el viaje.'); return; }
    setCancelTripConfirm(null);
    toast.success('Viaje cancelado. Los pasajeros recibirán reembolso del 100%.');
    setDriverTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'cancelled' } : t));
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
      total_seats: String(t.total_seats), price_per_seat: String(t.price_per_seat),
      accepts_pets: t.accepts_pets, allows_luggage: t.allows_luggage, observations: t.observations || '',
    });
  };

  const saveEditTrip = async () => {
    if (!editingTrip) return;
    const totalSeats = clampSeatCount(editForm.total_seats ?? editingTrip.total_seats, 1, MAX_DRIVER_VEHICLE_SEATS, editingTrip.total_seats);
    const occupiedSeats = getSeatSummary(editingTrip.total_seats, editingTrip.available_seats).occupiedSeats;
    if (totalSeats < occupiedSeats) {
      toast.error(`No podés bajar de ${occupiedSeats} asientos porque ya están ocupados.`);
      return;
    }
    setEditSaving(true);
    const { error } = await supabase.from('trips').update({
      origin: normalizeLocation(editForm.origin),
      destination: normalizeLocation(editForm.destination),
      date: editForm.date, time: editForm.time,
      total_seats: totalSeats,
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

  // Friendly date formatter (Hoy / Mañana / dd MMM)
  const friendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const today = new Date(); today.setHours(0,0,0,0);
      const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
      if (diff === 0) return 'Hoy';
      if (diff === 1) return 'Mañana';
      if (diff === -1) return 'Ayer';
      return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    } catch { return dateStr; }
  };

  // Estimate arrival time (assume 6h trip if no real ETA) — purely visual
  const estimateArrival = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const d = new Date(); d.setHours(h || 0, m || 0, 0, 0);
    d.setHours(d.getHours() + 6);
    return d.toTimeString().slice(0,5);
  };

  return (
    <div className="min-h-screen pb-20 bg-background relative">
      <AppHeader />

      {/* Title section */}
      <div className="bg-background px-4 pt-5 pb-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-primary leading-tight">Mis viajes</h1>
            <p className="text-sm text-muted-foreground">Gestioná tus viajes</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-4 relative z-10">
        {loading ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando...</p></div>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'active' | 'history' | 'driver')}>
            <div className="mb-4 -mx-4 px-4 overflow-x-auto scrollbar-hide">
              <TabsList className="inline-flex w-auto h-auto bg-card border border-border rounded-2xl p-1.5 gap-2">
                <TabsTrigger
                  value="active"
                  className="shrink-0 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                >
                  Activos
                  {totalActive > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">{totalActive}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="shrink-0 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Historial</TabsTrigger>
                {isDriver && <TabsTrigger value="driver" className="shrink-0 px-5 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">Publicados</TabsTrigger>}
              </TabsList>
            </div>

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
                const isInTrip = ['driver_on_way', 'driver_arrived', 'in_transit'].includes(b.status);
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + activeRequests.length) * 0.04 }}>
                    <div className="bg-card rounded-3xl p-5 border border-border shadow-[0_2px_12px_-4px_hsl(var(--primary)/0.08)]">
                      {/* Top row: icon + status + rating placeholder */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <UserIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${isInTrip ? 'bg-primary/10 text-primary' : sc.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isInTrip ? 'bg-primary animate-pulse' : 'bg-current'}`} />
                            {isInTrip ? 'En viaje' : sc.label}
                          </div>
                        </div>
                      </div>

                      {/* Route + price */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <h2 className="font-heading font-bold text-xl text-primary leading-tight flex items-center gap-2 flex-wrap">
                          <span>{b.origin}</span>
                          <ArrowRight className="h-5 w-5 text-primary shrink-0" />
                          <span>{b.destination}</span>
                        </h2>
                      </div>

                      <div className="flex items-end justify-between gap-3 mb-4">
                        {/* Time/date row */}
                        <div className="flex items-start gap-4 text-xs">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 text-foreground font-semibold text-sm"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> {b.time?.slice(0,5)}</div>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Salida</span>
                          </div>
                          <div className="w-px h-8 bg-border" />
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 text-foreground font-semibold text-sm"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> {estimateArrival(b.time)}</div>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Llegada</span>
                          </div>
                          <div className="w-px h-8 bg-border" />
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-1 text-foreground font-semibold text-sm"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> {friendlyDate(b.date)}</div>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Fecha</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-bold text-2xl text-primary leading-none">{formatPrice(Number(b.price_per_seat))}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">por asiento</p>
                          <p className="text-[10px] text-muted-foreground">Precio final</p>
                        </div>
                      </div>

                      {/* Occupancy */}
                      <div className="bg-muted/30 rounded-2xl p-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Armchair className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground mb-1.5">{b.seats} de {b.seats} asiento{b.seats > 1 ? 's' : ''} reservado{b.seats > 1 ? 's' : ''}</p>
                            <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Driver info */}
                      <p className="text-xs text-muted-foreground mb-3">Chofer: <span className="font-medium text-foreground">{b.driverName}</span></p>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        {['accepted', 'coordinating'].includes(b.status) && (
                          <>
                            <Button size="sm" className="flex-1 h-11 rounded-xl gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate(`/chat/${b.id}?phase=coordination`)}>
                              <MessageCircle className="h-4 w-4" /> Coordinar
                            </Button>
                            <Button size="sm" variant="outline" className="h-11 rounded-xl gap-1.5 text-sm" disabled={actionLoading === `pay-${b.id}`} onClick={() => handlePayBooking(b.id)}>
                              <CreditCard className="h-4 w-4" /> {actionLoading === `pay-${b.id}` ? '...' : 'Pagar'}
                            </Button>
                          </>
                        )}
                        {['paid', 'driver_on_way', 'driver_arrived', 'in_transit'].includes(b.status) && (
                          <Button size="sm" className="flex-1 h-11 rounded-xl gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate(`/chat/${b.id}`)}>
                            Ver viaje <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        {b.status === 'pending' && (
                          <Button size="sm" className="flex-1 h-11 rounded-xl gap-1.5 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate(`/chat/${b.id}`)}>
                            Ver viaje <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        {CANCELLABLE_STATUSES.includes(b.status) && (
                          <Button size="sm" variant="outline" className="h-11 rounded-xl gap-1.5 text-sm text-destructive border-destructive/30" disabled={actionLoading === b.id} onClick={() => promptCancelBooking(b)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {pastRequests.map((r, i) => {
                const isExpired = r.status === 'expired' || (r.status === 'active' && isItemExpired(r.date, r.time));
                return (
                  <div key={r.id} className="bg-card rounded-2xl p-4 border border-border opacity-70">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5"><Hand className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground uppercase">Busqué viaje</span></div>
                      {isExpired && <Badge className="text-[10px] gap-1 rounded-full px-2 py-0.5 border bg-muted text-muted-foreground border-border"><Clock className="h-3 w-3" /> Vencido</Badge>}
                      {r.status === 'cancelled' && <Badge className="text-[10px] gap-1 rounded-full px-2 py-0.5 border bg-destructive/15 text-destructive border-destructive/30"><XCircle className="h-3 w-3" /> Cancelado</Badge>}
                    </div>
                    <p className="font-semibold text-sm font-heading">{r.origin} → {r.destination}</p>
                    <p className="text-xs text-muted-foreground">{r.date} · {r.time}hs</p>
                  </div>
                );
              })}
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
                        <span className="font-heading font-bold text-primary">{formatPrice(Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0))}</span>
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
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Totales: {t.total_seats}</span>
                              <span>Ocupados: {getSeatSummary(t.total_seats, t.available_seats).occupiedSeats}</span>
                              <span>Disponibles: {t.available_seats}</span>
                              <span className="font-heading font-bold text-primary">{formatPrice(Number(t.price_per_seat))}/asiento</span>
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
                                  <Button size="sm" className="h-9 rounded-xl gap-1 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80" disabled={actionLoading === t.id} onClick={async () => {
                                    setActionLoading(t.id);
                                    await supabase.from('bookings').update({ status: 'driver_arrived' as any }).eq('trip_id', t.id).in('status', ['driver_on_way', 'paid']);
                                    setActionLoading(null);
                                    toast.success('Llegaste al punto de encuentro.');
                                  }}><MapPinCheck className="h-3 w-3" /> Llegué</Button>
                                  <Button size="sm" className="h-9 rounded-xl gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90" disabled={actionLoading === t.id} onClick={async () => {
                                    setActionLoading(t.id);
                                    await supabase.from('bookings').update({ status: 'in_transit' as any }).eq('trip_id', t.id).in('status', ['driver_on_way', 'driver_arrived', 'paid']);
                                    setActionLoading(null);
                                    toast.success('Viaje iniciado.');
                                  }}><Route className="h-3 w-3" /> Iniciar viaje</Button>
                                  <Button size="sm" className="h-9 rounded-xl gap-1 text-xs gradient-accent text-primary-foreground" disabled={actionLoading === t.id} onClick={() => handleTripAction(t.id, 'completed')}><Flag className="h-3 w-3" /> Finalizar</Button>
                                </>
                              )}
                              {['active', 'paused', 'full'].includes(t.status) && (
                                <Button size="sm" variant="outline" className="h-9 rounded-xl gap-1 text-xs text-destructive border-destructive/30" disabled={actionLoading === t.id} onClick={() => setCancelTripConfirm(t)}>
                                  <XCircle className="h-3 w-3" /> Cancelar viaje
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
                <Label className="text-xs text-muted-foreground mb-1 block">Asientos totales</Label>
                <Input type="number" min={1} max={MAX_DRIVER_VEHICLE_SEATS} step={1} value={editForm.total_seats ?? editingTrip?.total_seats ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, total_seats: e.target.value }))} className="h-10 rounded-xl" />
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

      {/* Cancel Booking (passenger) */}
      <CancelBookingDialog
        open={!!cancelConfirm}
        onOpenChange={(open) => !open && setCancelConfirm(null)}
        role="passenger"
        refund={cancelConfirm?.refund ?? null}
        routeLabel={cancelConfirm ? `${cancelConfirm.booking.origin} → ${cancelConfirm.booking.destination}` : undefined}
        loading={actionLoading === cancelConfirm?.booking.id}
        variant="booking"
        onConfirm={confirmCancelBooking}
      />

      {/* Cancel Trip (driver) */}
      <CancelBookingDialog
        open={!!cancelTripConfirm}
        onOpenChange={(open) => !open && setCancelTripConfirm(null)}
        role="driver"
        refund={null}
        routeLabel={cancelTripConfirm ? `${cancelTripConfirm.origin} → ${cancelTripConfirm.destination}` : undefined}
        loading={actionLoading === cancelTripConfirm?.id}
        variant="trip"
        onConfirm={confirmCancelTripAsDriver}
      />

      {/* Footer hero road image */}
      <div className="relative mt-10">
        <div className="relative h-64 overflow-hidden">
          <img src={heroRoad} alt="WEEGO ruta" className="absolute inset-0 w-full h-full object-cover" />
          {/* white gradient at top so it doesn't clash with content */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/30 to-transparent" />
          {/* subtle bottom darken so logo is legible */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 drop-shadow-lg">
              <img src={weegoLogo} alt="WEEGO" className="h-10 w-10 object-contain" />
              <span className="font-heading font-bold text-3xl tracking-tight text-primary">
                WEE<span className="text-accent">GO</span>
              </span>
            </div>
            <span className="text-xs text-white/90 font-medium mt-1 drop-shadow">Viajá juntos</span>
          </div>
        </div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default MyTrips;
