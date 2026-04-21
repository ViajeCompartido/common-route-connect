import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, Scale, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PLATFORM_COMMISSION_RATE, calculateServiceFee } from '@/lib/tripUtils';
import { formatPrice } from '@/lib/formatPrice';

interface FinanceData {
  moneyIn: number;        // total cobrado a pasajeros
  driverPayouts: number;  // total liquidado/a liquidar a choferes
  platformFee: number;    // comisión 7%
  refunded: number;       // reembolsos a pasajeros
  pendingPayouts: number; // pagos retenidos (status held/pending)
  balance: number;        // moneyIn - driverPayouts - refunded
}

const AdminFinance = () => {
  const [data, setData] = useState<FinanceData>({
    moneyIn: 0, driverPayouts: 0, platformFee: 0,
    refunded: 0, pendingPayouts: 0, balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);

    // Reservas que generaron movimiento de dinero
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
        // Asumimos reembolso total para cancelaciones (la lógica fina vive en calculate_refund_percentage)
        refunded += total;
        return;
      }
      moneyIn += total;
      platformFee += fee;
      if (b.status === 'completed') driverPayouts += subtotal;
    });

    // Pagos pendientes desde la tabla payments si existen
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

  if (loading) {
    return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando finanzas...</p></div>;
  }

  const cards = [
    { label: 'Dinero que entra', value: formatPrice(data.moneyIn), icon: ArrowDownCircle, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pagos a choferes', value: formatPrice(data.driverPayouts), icon: ArrowUpCircle, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { label: `Comisión plataforma (${Math.round(PLATFORM_COMMISSION_RATE * 100)}%)`, value: formatPrice(data.platformFee), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Reembolsos', value: formatPrice(data.refunded), icon: ArrowUpCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Payouts pendientes', value: formatPrice(data.pendingPayouts), icon: Wallet, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Balance neto', value: formatPrice(data.balance), icon: Scale, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4">
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
    </div>
  );
};

export default AdminFinance;
