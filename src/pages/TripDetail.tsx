import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, PawPrint, Luggage, Star, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { mockTrips, mockReviews } from '@/data/mockData';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const trip = mockTrips.find(t => t.id === id);
  const [bookingStatus, setBookingStatus] = useState<'none' | 'pending' | 'accepted' | 'paid'>('none');

  if (!trip) return <div className="p-8 text-center">Viaje no encontrado</div>;

  const handleReserve = () => {
    setBookingStatus('pending');
    toast.success('Solicitud enviada al chofer');
  };

  const handleSimulateAccept = () => {
    setBookingStatus('accepted');
    toast.success('¡El chofer aceptó tu solicitud!');
  };

  const handlePay = () => {
    setBookingStatus('paid');
    toast.success('¡Pago realizado! Ya podés chatear con el chofer.');
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Detalle del viaje</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5">
            {/* Route */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <div className="w-0.5 h-10 bg-border" />
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{trip.origin}</p>
                <p className="font-semibold mt-6">{trip.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {trip.date} · {trip.time}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" /> {trip.availableSeats} de {trip.totalSeats} lugares
              </div>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {trip.acceptsPets && <Badge variant="secondary" className="gap-1"><PawPrint className="h-3 w-3" /> Acepta mascotas</Badge>}
              {trip.hasPet && <Badge variant="secondary" className="gap-1"><PawPrint className="h-3 w-3" /> Viaja con mascota</Badge>}
              {trip.allowsLuggage && <Badge variant="secondary" className="gap-1"><Luggage className="h-3 w-3" /> Equipaje grande</Badge>}
            </div>

            <div className="flex items-center justify-between py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Precio por asiento</span>
              <span className="text-2xl font-heading font-bold text-primary">${trip.pricePerSeat.toLocaleString()}</span>
            </div>
          </Card>

          {/* Driver info */}
          <Card className="p-4 mt-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-lg">
                {trip.driverName.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold font-heading">{trip.driverName}</p>
                <div className="flex items-center gap-2">
                  <StarRating rating={trip.driverRating} size="sm" />
                  <span className="text-sm text-muted-foreground">{trip.driverRating}</span>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold font-heading">Comentarios</h3>
              {mockReviews.slice(0, 2).map(r => (
                <div key={r.id} className="bg-secondary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{r.fromUserName}</span>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="mt-4 space-y-2">
            {bookingStatus === 'none' && (
              <Button onClick={handleReserve} className="w-full gradient-accent text-primary-foreground">
                Solicitar reserva
              </Button>
            )}
            {bookingStatus === 'pending' && (
              <>
                <p className="text-sm text-center text-muted-foreground">Esperando respuesta del chofer...</p>
                <Button onClick={handleSimulateAccept} variant="outline" className="w-full text-xs">
                  (Simular: chofer acepta)
                </Button>
              </>
            )}
            {bookingStatus === 'accepted' && (
              <Button onClick={handlePay} className="w-full gradient-accent text-primary-foreground">
                Pagar con Mercado Pago
              </Button>
            )}
            {bookingStatus === 'paid' && (
              <Button onClick={() => toast.info('Chat próximamente disponible')} variant="outline" className="w-full gap-2">
                <MessageCircle className="h-4 w-4" /> Chatear con el chofer
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default TripDetail;
