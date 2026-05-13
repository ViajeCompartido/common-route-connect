import { Sparkles, MapPin, Clock, Users, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useCompatiblePassengers, useCompatibleTrips } from '@/hooks/useCompatibleMatches';
import OfferDialog from '@/components/OfferDialog';
import { getInitial } from '@/lib/avatarUtils';
import { formatPrice } from '@/lib/formatPrice';

interface DriverProps {
  mode: 'driver';
  tripId: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: number;
}

interface PassengerProps {
  mode: 'passenger';
  requestId: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  seats: number;
  currentUserId?: string;
}

type Props = DriverProps | PassengerProps;

const CompatibleMatchesSection = (props: Props) => {
  const [offerTarget, setOfferTarget] = useState<{ tripId: string; passengerId: string; rideRequestId?: string | null; seats: number; name: string } | null>(null);

  if (props.mode === 'driver') {
    const { matches, loading } = useCompatiblePassengers({
      tripId: props.tripId,
      origin: props.origin,
      destination: props.destination,
      date: props.date,
      time: props.time,
      seats: props.availableSeats,
    });

    if (loading) return null;
    if (matches.length === 0) return null;

    return (
      <div className="bg-accent/5 border border-accent/30 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
            Pasajeros compatibles ({matches.length})
          </span>
        </div>
        <div className="space-y-2">
          {matches.slice(0, 5).map(m => (
            <div key={m.id} className="flex items-center gap-2 bg-card rounded-lg p-2 border border-border">
              <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center font-heading font-bold text-xs shrink-0 overflow-hidden">
                {m.avatar_url ? <img src={m.avatar_url} alt={m.passenger_name} className="w-full h-full object-cover" /> : getInitial(m.passenger_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{m.passenger_name}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> {m.time?.slice(0,5)} · <Users className="h-2.5 w-2.5" /> {m.seats} · {m.matchLabel}
                </p>
              </div>
              {m.hasOffer ? (
                <span className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded-full bg-muted">
                  {m.offerStatus === 'accepted' ? 'Aceptada' : m.offerStatus === 'rejected' ? 'Rechazada' : 'Enviada'}
                </span>
              ) : (
                <Button
                  size="sm"
                  className="h-8 rounded-lg gap-1 text-[11px] gradient-accent text-primary-foreground"
                  onClick={() => setOfferTarget({
                    tripId: props.tripId,
                    passengerId: m.passenger_id,
                    rideRequestId: m.id,
                    seats: m.seats,
                    name: m.passenger_name,
                  })}
                >
                  <Send className="h-3 w-3" /> Ofrecer
                </Button>
              )}
            </div>
          ))}
        </div>
        {offerTarget && (
          <OfferDialog
            open={!!offerTarget}
            onOpenChange={(v) => !v && setOfferTarget(null)}
            tripId={offerTarget.tripId}
            passengerId={offerTarget.passengerId}
            rideRequestId={offerTarget.rideRequestId}
            seats={offerTarget.seats}
            recipientName={offerTarget.name}
          />
        )}
      </div>
    );
  }

  // passenger mode
  const { matches, loading } = useCompatibleTrips({
    requestId: props.requestId,
    origin: props.origin,
    destination: props.destination,
    date: props.date,
    time: props.time,
    seats: props.seats,
  }, props.currentUserId);

  if (loading) return null;
  if (matches.length === 0) return null;

  return (
    <div className="bg-primary/5 border border-primary/30 rounded-xl p-3 mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
          Choferes compatibles ({matches.length})
        </span>
      </div>
      <div className="space-y-2">
        {matches.slice(0, 5).map(m => (
          <div key={m.id} className="flex items-center gap-2 bg-card rounded-lg p-2 border border-border">
            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-heading font-bold text-xs shrink-0 overflow-hidden">
              {m.avatar_url ? <img src={m.avatar_url} alt={m.driver_name} className="w-full h-full object-cover" /> : getInitial(m.driver_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{m.driver_name}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" /> {m.time?.slice(0,5)} · {formatPrice(m.price_per_seat)} · {m.matchLabel}
              </p>
            </div>
            {m.hasOffer ? (
              <span className="text-[10px] font-semibold text-muted-foreground px-2 py-1 rounded-full bg-muted">
                {m.offerStatus === 'accepted' ? 'Aceptada' : m.offerStatus === 'rejected' ? 'Rechazada' : 'Enviada'}
              </span>
            ) : (
              <Button
                size="sm"
                className="h-8 rounded-lg gap-1 text-[11px] bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => setOfferTarget({
                  tripId: m.id,
                  passengerId: props.currentUserId!,
                  rideRequestId: props.requestId,
                  seats: props.seats,
                  name: m.driver_name,
                })}
              >
                <Send className="h-3 w-3" /> Solicitar
              </Button>
            )}
          </div>
        ))}
      </div>
      {offerTarget && (
        <OfferDialog
          open={!!offerTarget}
          onOpenChange={(v) => !v && setOfferTarget(null)}
          tripId={offerTarget.tripId}
          passengerId={offerTarget.passengerId}
          rideRequestId={offerTarget.rideRequestId}
          seats={offerTarget.seats}
          recipientName={offerTarget.name}
        />
      )}
    </div>
  );
};

export default CompatibleMatchesSection;
