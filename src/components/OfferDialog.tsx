import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string;
  passengerId: string;
  rideRequestId?: string | null;
  seats?: number;
  recipientName?: string;
  onSuccess?: () => void;
}

const OfferDialog = ({ open, onOpenChange, tripId, passengerId, rideRequestId, seats = 1, recipientName, onSuccess }: OfferDialogProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    const { error } = await supabase.rpc('create_trip_offer' as any, {
      _trip_id: tripId,
      _passenger_id: passengerId,
      _ride_request_id: rideRequestId ?? null,
      _seats: seats,
      _message: message.trim() || null,
    });
    setSending(false);
    if (error) {
      toast.error(error.message || 'No se pudo enviar la oferta.');
      return;
    }
    toast.success('Oferta enviada. La otra persona recibirá una notificación.');
    setMessage('');
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Enviar oferta{recipientName ? ` a ${recipientName}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">Mensaje (opcional)</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hola! Tengo lugar en mi viaje, podemos coordinar."
            rows={3}
            className="rounded-xl resize-none"
            maxLength={300}
          />
          <p className="text-[11px] text-muted-foreground">
            Si se acepta, se reservará {seats} asiento{seats > 1 ? 's' : ''} automáticamente.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={handleSend} disabled={sending} className="gradient-accent text-primary-foreground">
            {sending ? 'Enviando...' : 'Enviar oferta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OfferDialog;
