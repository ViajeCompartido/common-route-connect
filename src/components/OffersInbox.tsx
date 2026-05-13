import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, MessageCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTripOffers } from '@/hooks/useTripOffers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { getInitial } from '@/lib/avatarUtils';

interface Props {
  scope: 'asDriver' | 'asPassenger';
}

const OffersInbox = ({ scope }: Props) => {
  const navigate = useNavigate();
  const { offers, reload } = useTripOffers(scope);
  const [busy, setBusy] = useState<string | null>(null);

  if (offers.length === 0) return null;

  const handleAccept = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc('accept_trip_offer' as any, { _offer_id: id });
    setBusy(null);
    if (error) { toast.error(error.message || 'No se pudo aceptar.'); return; }
    toast.success('Oferta aceptada. Asiento reservado.');
    reload();
  };

  const handleReject = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.rpc('reject_trip_offer' as any, { _offer_id: id, _reason: null });
    setBusy(null);
    if (error) { toast.error(error.message || 'No se pudo rechazar.'); return; }
    toast.success('Oferta rechazada.');
    reload();
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
        {scope === 'asDriver' ? 'Solicitudes enviadas' : 'Ofertas recibidas'}
      </p>
      {offers.map(o => {
        const statusBadge = o.status === 'pending' ? 'bg-amber-500/15 text-amber-700' : o.status === 'accepted' ? 'bg-green-500/15 text-green-700' : 'bg-destructive/15 text-destructive';
        const statusLabel = o.status === 'pending' ? 'Pendiente' : o.status === 'accepted' ? 'Aceptada' : 'Rechazada';
        const isReceiver = (scope === 'asDriver' && o.initiated_by === 'passenger') || (scope === 'asPassenger' && o.initiated_by === 'driver');
        return (
          <div key={o.id} className="bg-card rounded-2xl p-3 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-heading font-bold text-xs shrink-0 overflow-hidden">
                {o.other_user_avatar ? <img src={o.other_user_avatar} alt={o.other_user_name} className="w-full h-full object-cover" /> : getInitial(o.other_user_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{o.other_user_name}</p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" /> {o.trip_origin} → {o.trip_destination}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" /> {o.trip_date} · {o.trip_time?.slice(0,5)} · {o.seats} asiento{o.seats > 1 ? 's' : ''}
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusBadge}`}>{statusLabel}</span>
            </div>
            {o.message && <p className="text-[11px] text-muted-foreground italic mb-2">"{o.message}"</p>}
            <div className="flex gap-2">
              {o.status === 'pending' && isReceiver && (
                <>
                  <Button size="sm" disabled={busy === o.id} onClick={() => handleAccept(o.id)} className="flex-1 h-9 rounded-lg gap-1 text-xs bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3" /> Aceptar
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy === o.id} onClick={() => handleReject(o.id)} className="h-9 rounded-lg gap-1 text-xs text-destructive border-destructive/30">
                    <XCircle className="h-3 w-3" /> Rechazar
                  </Button>
                </>
              )}
              {o.status === 'accepted' && o.booking_id && (
                <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${o.booking_id}`)} className="flex-1 h-9 rounded-lg gap-1 text-xs">
                  <MessageCircle className="h-3 w-3" /> Chatear
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OffersInbox;
