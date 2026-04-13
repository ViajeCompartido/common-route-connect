import { useState, useEffect } from 'react';
import { getInitial } from '@/lib/avatarUtils';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, BadgeCheck, Star, MessageCircle, CheckCircle2, XCircle, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BookingWithDetails {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats: number;
  has_pet: boolean;
  has_luggage: boolean;
  message: string | null;
  status: string;
  price_per_seat: number;
  created_at: string;
  // Joined data
  passengerName: string;
  passengerRating: number;
  passengerTrips: number;
  passengerVerified: boolean;
  tripOrigin: string;
  tripDestination: string;
  tripDate: string;
  tripTime: string;
}

const DriverRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('driver_id', user.id)
      .in('status', ['pending', 'accepted', 'coordinating'])
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Enrich with passenger profiles and trip info
    const enriched: BookingWithDetails[] = [];
    for (const b of data) {
      const [{ data: profile }, { data: trip }] = await Promise.all([
        supabase.from('profiles').select('first_name, last_name, average_rating, total_trips, verified').eq('id', b.passenger_id).single(),
        supabase.from('trips').select('origin, destination, date, time').eq('id', b.trip_id).single(),
      ]);

      enriched.push({
        ...b,
        passengerName: profile ? `${profile.first_name} ${profile.last_name}`.trim() || 'Pasajero' : 'Pasajero',
        passengerRating: profile?.average_rating ?? 0,
        passengerTrips: profile?.total_trips ?? 0,
        passengerVerified: profile?.verified ?? false,
        tripOrigin: trip?.origin ?? '',
        tripDestination: trip?.destination ?? '',
        tripDate: trip?.date ?? '',
        tripTime: trip?.time ?? '',
      });
    }

    setBookings(enriched);
    setLoading(false);
  };

  const handleAccept = async (booking: BookingWithDetails) => {
    setActionLoading(booking.id);

    // Update booking status to accepted
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'accepted' })
      .eq('id', booking.id);

    if (bookingError) {
      toast.error('Error al aceptar la solicitud.');
      setActionLoading(null);
      return;
    }

    // Decrement available seats on the trip
    const { data: tripData } = await supabase
      .from('trips')
      .select('available_seats')
      .eq('id', booking.trip_id)
      .single();

    if (tripData) {
      const newSeats = Math.max(0, tripData.available_seats - booking.seats);
      const updates: any = { available_seats: newSeats };
      if (newSeats === 0) updates.status = 'full';

      await supabase.from('trips').update(updates).eq('id', booking.trip_id);
    }

    setActionLoading(null);
    toast.success('¡Solicitud aceptada! Se abre el chat de coordinación.');

    // Update local state
    setBookings(prev => prev.map(b =>
      b.id === booking.id ? { ...b, status: 'accepted' } : b
    ));
  };

  const handleReject = async (bookingId: string) => {
    setActionLoading(bookingId);
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'rejected' })
      .eq('id', bookingId);

    setActionLoading(null);
    if (error) {
      toast.error('Error al rechazar la solicitud.');
      return;
    }
    toast('Solicitud rechazada.');
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Solicitudes recibidas</h1>
          <p className="text-sm text-primary-foreground/70">Revisá las solicitudes y decidí si aceptás o rechazás.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Cargando solicitudes...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No tenés solicitudes pendientes.</p>
          </div>
        ) : (
          bookings.map((req, i) => (
            <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="bg-card rounded-2xl p-5 border border-border">
                {/* Passenger info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-lg shrink-0">
                    {getInitial(req.passengerName)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold font-heading text-sm">{req.passengerName}</span>
                      {req.passengerVerified && <BadgeCheck className="h-4 w-4 text-accent" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1">
                        <StarRating rating={req.passengerRating} size="sm" />
                        <span className="text-xs font-bold">{req.passengerRating}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Car className="h-3 w-3" /> {req.passengerTrips} viajes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trip details */}
                <div className="bg-secondary/60 rounded-xl p-3 mb-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span>{req.tripOrigin}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{req.tripDestination}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.tripDate} · {req.tripTime}hs</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {req.seats} lugar{req.seats > 1 ? 'es' : ''}</span>
                  </div>
                  <div className="flex gap-2">
                    {req.has_pet && (
                      <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5">
                        <PawPrint className="h-3 w-3" /> Con mascota
                      </Badge>
                    )}
                    {req.has_luggage && (
                      <Badge variant="secondary" className="text-[10px] gap-1 rounded-full px-2 py-0.5">
                        <Luggage className="h-3 w-3" /> Equipaje grande
                      </Badge>
                    )}
                  </div>
                </div>

                {req.message && (
                  <p className="text-xs text-muted-foreground italic mb-3 px-1">"{req.message}"</p>
                )}

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleAccept(req)}
                      disabled={actionLoading === req.id}
                      className="h-11 rounded-xl gap-1.5 text-sm gradient-accent text-primary-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Aceptar
                    </Button>
                    <Button
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoading === req.id}
                      variant="outline"
                      className="h-11 rounded-xl gap-1.5 text-sm text-destructive border-destructive/30"
                    >
                      <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                  </div>
                )}
                {req.status === 'accepted' && (
                  <div className="bg-accent/10 rounded-xl p-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-accent">Aceptado</p>
                      <p className="text-[10px] text-muted-foreground">Se abrió el chat de coordinación.</p>
                    </div>
                    <Button size="sm" className="h-8 rounded-lg gap-1 text-xs gradient-accent text-primary-foreground" onClick={() => navigate(`/chat/${req.trip_id}?phase=coordination`)}>
                      <MessageCircle className="h-3 w-3" /> Chat
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <BottomNav role="driver" />
    </div>
  );
};

export default DriverRequests;
