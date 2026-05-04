import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, Scale, DollarSign, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateServiceFee } from '@/lib/tripUtils';
import { formatPrice } from '@/lib/formatPrice';
import { useCommissionRate } from '@/hooks/useCommissionRate';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface FinanceData {
  moneyIn: number;
  driverPayouts: number;
  platformFee: number;
  refunded: number;
  pendingPayouts: number;
  balance: number;
}

const AdminFinance = () => {
  const { isAdmin } = useProfile();
  const { rate, ratePercent, updateRate } = useCommissionRate();
  const [data, setData] = useState<FinanceData>({
    moneyIn: 0, driverPayouts: 0, platformFee: 0,
    refunded: 0, pendingPayouts: 0, balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [pctInput, setPctInput] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [rate]);

  const load = async () => {
    setLoading(true);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('price_per_seat, seats, pet_surcharge, status')
      .in('status', ['paid', 'completed', 'in_transit', 'driver_on_way', 'driver_arrived', 'cancelled_passenger', 'cancelled_driver']);

    let moneyIn = 0, driverPayouts = 0, platformFee = 0, refunded = 0;

    (bookings ?? []).forEach(b => {
      const subtotal = Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0);
      const fee = calculateServiceFee(subtotal);
      const total = subtotal + fee;

      const isCancelled = b.status === 'cancelled_passenger' || b.status === 'cancelled_driver';
      if (isCancelled) {
        refunded += total;
        return;
      }
      moneyIn += total;
      platformFee += fee;
      if (b.status === 'completed') driverPayouts += subtotal;
    });

    const { data: payments } = await supabase
      .from('payments')
      .select('driver_payout, status');

    const pendingPayouts = (payments ?? [])
      .filter(p => p.status === 'held' || p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.driver_payout || 0), 0);

    setData({
      moneyIn,
      driverPayouts,
      platformFee,
      refunded,
      pendingPayouts,
      balance: moneyIn - driverPayouts - refunded,
    });
    setLoading(false);
  };

  const openEdit = () => {
    setPctInput(String(ratePercent));
    setEditOpen(true);
  };

  const handleSave = async () => {
    const num = Number(pctInput.replace(',', '.'));
    if (Number.isNaN(num) || num < 0 || num > 100) {
      toast.error('Ingresá un porcentaje válido entre 0 y 100');
      return;
    }
    setSaving(true);
    const { error } = await updateRate(num);
    setSaving(false);
    if (error) {
      toast.error('No se pudo actualizar la comisión');
      return;
    }
    toast.success(`Comisión actualizada a ${num}%`);
    setEditOpen(false);
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando finanzas...</p></div>;
  }

  const cards = [
    { label: 'Dinero que entra', value: formatPrice(data.moneyIn), icon: ArrowDownCircle, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pagos a choferes', value: formatPrice(data.driverPayouts), icon: ArrowUpCircle, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: 'Reembolsos', value: formatPrice(data.refunded), icon: ArrowUpCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Payouts pendientes', value: formatPrice(data.pendingPayouts), icon: Wallet, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Balance neto', value: formatPrice(data.balance), icon: Scale, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Commission card (special, with edit) */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 h-full flex flex-col">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-base font-heading font-bold leading-tight">{formatPrice(data.platformFee)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Comisión actual: {ratePercent}%</p>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={openEdit}
                className="mt-2 h-7 text-[10px] gap-1 self-start"
              >
                <Pencil className="h-3 w-3" />
                Editar comisión
              </Button>
            )}
          </Card>
        </motion.div>

        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 1) * 0.04 }}>
            <Card className="p-4 h-full">
              <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${c.bg} mb-2`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
              <p className="text-base font-heading font-bold leading-tight">{c.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{c.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-heading font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-accent" /> Resumen del flujo
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Total cobrado</span><span className="font-bold">{formatPrice(data.moneyIn)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">– Pagado a choferes</span><span className="font-bold text-amber-600">−{formatPrice(data.driverPayouts)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">– Reembolsos</span><span className="font-bold text-destructive">−{formatPrice(data.refunded)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 mt-2">
            <span className="font-medium">Balance neto plataforma</span>
            <span className="font-bold text-accent">{formatPrice(data.balance)}</span>
          </div>
        </div>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar comisión</DialogTitle>
            <DialogDescription>
              Este porcentaje se aplica al precio de los viajes y al cálculo de comisiones de la plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="commission-pct" className="text-xs">Porcentaje de comisión</Label>
            <div className="relative">
              <Input
                id="commission-pct"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.01"
                value={pctInput}
                onChange={(e) => setPctInput(e.target.value)}
                placeholder="7"
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Valor actual: {ratePercent}%</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinance;
