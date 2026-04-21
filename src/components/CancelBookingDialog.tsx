import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';
import { PASSENGER_REASONS, DRIVER_REASONS } from '@/lib/cancellationReasons';
import type { RefundInfo } from '@/lib/cancellationPolicy';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'passenger' | 'driver';
  refund: RefundInfo | null;
  routeLabel?: string;
  loading?: boolean;
  /** Title and description shown when cancelling a full trip (driver) */
  variant?: 'booking' | 'trip';
  onConfirm: (reason: string, category: string) => void;
}

const CancelBookingDialog = ({ open, onOpenChange, role, refund, routeLabel, loading, variant = 'booking', onConfirm }: Props) => {
  const [category, setCategory] = useState<string>('');
  const [details, setDetails] = useState('');

  const reasons = role === 'driver' ? DRIVER_REASONS : PASSENGER_REASONS;
  const selected = reasons.find(r => r.category === category);
  const canSubmit = !!selected && (selected.category !== 'other' || details.trim().length >= 3);

  const handleConfirm = () => {
    if (!selected) return;
    const reasonText = selected.category === 'other'
      ? details.trim()
      : details.trim() ? `${selected.label} — ${details.trim()}` : selected.label;
    onConfirm(reasonText, selected.category);
  };

  const handleClose = (next: boolean) => {
    if (!next) { setCategory(''); setDetails(''); }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {variant === 'trip' ? 'Cancelar viaje publicado' : 'Cancelar reserva'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {routeLabel && (
            <p className="text-sm font-medium text-foreground">{routeLabel}</p>
          )}

          {variant === 'trip' && role === 'driver' && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <p className="text-sm font-semibold text-destructive">Cancelación del viaje</p>
              <p className="text-xs text-muted-foreground mt-1">
                Se cancelarán todas las reservas asociadas y los pasajeros recibirán reembolso del 100%.
                Esta acción puede afectar tu reputación.
              </p>
            </div>
          )}

          {variant === 'booking' && refund && (
            <div className={`rounded-xl p-3 border ${refund.percentage === 100 ? 'bg-green-500/10 border-green-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
              <p className={`text-sm font-semibold ${refund.percentage === 100 ? 'text-green-700' : 'text-amber-700'}`}>
                {refund.label}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{refund.description}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-semibold mb-2 block">¿Por qué cancelás?</Label>
            <RadioGroup value={category} onValueChange={setCategory} className="space-y-1.5">
              {reasons.map(r => (
                <label key={r.category} className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <RadioGroupItem value={r.category} id={r.category} />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {selected && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {selected.category === 'other' ? 'Contanos qué pasó (obligatorio)' : 'Detalles adicionales (opcional)'}
              </Label>
              <Textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Escribí brevemente para que la otra parte entienda..."
                className="rounded-xl resize-none"
                rows={3}
                maxLength={300}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>Volver</Button>
          <Button
            variant="destructive"
            disabled={!canSubmit || loading}
            onClick={handleConfirm}
          >
            {loading ? 'Cancelando...' : 'Confirmar cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelBookingDialog;
