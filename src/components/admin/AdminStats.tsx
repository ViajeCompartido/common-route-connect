import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Car, Users, DollarSign, TrendingUp, XCircle, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PLATFORM_COMMISSION_RATE, calculateServiceFee } from '@/lib/tripUtils';
import { formatPrice } from '@/lib/formatPrice';

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalTrips: 0, completedTrips: 0, totalBookings: 0, totalUsers: 0,
    grossRevenue: 0, platformFees: 0, driverPayouts: 0, cancelledTrips: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const [
      { count: totalTrips },
      { count: completedTrips },
      { count: totalBookings },
      { count: totalUsers },
      { count: cancelledTrips },
      { data: completedBookings },
    ] = await Promise.all([
      supabase.from('trips').select('id', { count: 'exact', head: true }),
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('bookings').select('price_per_seat, seats, pet_surcharge').in('status', ['completed', 'paid']),
    ]);

    let grossRevenue = 0;
    let platformFees = 0;
    (completedBookings ?? []).forEach(b => {
      const subtotal = Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0);
      const fee = calculateServiceFee(subtotal);
      grossRevenue += subtotal + fee;
      platformFees += fee;
    });

    setStats({
      totalTrips: totalTrips ?? 0, completedTrips: completedTrips ?? 0,
      totalBookings: totalBookings ?? 0, totalUsers: totalUsers ?? 0,
      grossRevenue, platformFees, driverPayouts: grossRevenue - platformFees,
      cancelledTrips: cancelledTrips ?? 0,
    });
    setLoading(false);
  };

  const statCards = [
    { label: 'Viajes publicados', value: stats.totalTrips.toString(), icon: Car, color: 'text-primary' },
    { label: 'Viajes completados', value: stats.completedTrips.toString(), icon: Car, color: 'text-accent' },
    { label: 'Reservas totales', value: stats.totalBookings.toString(), icon: Users, color: 'text-ocean-light' },
    { label: 'Usuarios registrados', value: stats.totalUsers.toString(), icon: UserCheck, color: 'text-primary' },
    { label: 'Ingresos brutos', value: formatPrice(stats.grossRevenue), icon: DollarSign, color: 'text-accent' },
    { label: `Comisión (${Math.round(PLATFORM_COMMISSION_RATE * 100)}%)`, value: formatPrice(stats.platformFees), icon: TrendingUp, color: 'text-ocean-light' },
    { label: 'Pagos a choferes', value: formatPrice(stats.driverPayouts), icon: DollarSign, color: 'text-amber-600' },
    { label: 'Viajes cancelados', value: stats.cancelledTrips.toString(), icon: XCircle, color: 'text-destructive' },
  ];

  if (loading) return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando estadísticas...</p></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-lg font-heading font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-heading font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-accent" /> Desglose de ingresos
        </h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Ingresos brutos</span><span className="font-bold">{formatPrice(stats.grossRevenue)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Comisión plataforma ({Math.round(PLATFORM_COMMISSION_RATE * 100)}%)</span><span className="font-bold text-accent">{formatPrice(stats.platformFees)}</span></div>
          <div className="flex justify-between border-t border-border pt-1"><span className="text-muted-foreground">Total a choferes</span><span className="font-bold">{formatPrice(stats.driverPayouts)}</span></div>
        </div>
      </Card>
    </div>
  );
};

export default AdminStats;
