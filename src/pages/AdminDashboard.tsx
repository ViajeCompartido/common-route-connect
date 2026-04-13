import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Car, DollarSign, TrendingUp, MapPin, PawPrint, Star, XCircle, BarChart3, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { PLATFORM_COMMISSION_RATE, calculateServiceFee } from '@/lib/tripUtils';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTrips: 0, completedTrips: 0, totalBookings: 0, totalUsers: 0,
    grossRevenue: 0, platformFees: 0, driverPayouts: 0, cancelledTrips: 0,
  });
  const [topRoutes, setTopRoutes] = useState<{ route: string; count: number }[]>([]);
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
      { data: tripsData },
    ] = await Promise.all([
      supabase.from('trips').select('id', { count: 'exact', head: true }),
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('bookings').select('price_per_seat, seats, pet_surcharge').in('status', ['completed', 'paid']),
      supabase.from('trips').select('origin, destination').eq('status', 'completed'),
    ]);

    let grossRevenue = 0;
    let platformFees = 0;
    (completedBookings ?? []).forEach(b => {
      const subtotal = Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0);
      const fee = calculateServiceFee(subtotal);
      grossRevenue += subtotal + fee;
      platformFees += fee;
    });

    // Top routes
    const routeCount: Record<string, number> = {};
    (tripsData ?? []).forEach(t => {
      const key = `${t.origin} → ${t.destination}`;
      routeCount[key] = (routeCount[key] || 0) + 1;
    });
    const sorted = Object.entries(routeCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([route, count]) => ({ route, count }));

    setStats({
      totalTrips: totalTrips ?? 0, completedTrips: completedTrips ?? 0,
      totalBookings: totalBookings ?? 0, totalUsers: totalUsers ?? 0,
      grossRevenue, platformFees, driverPayouts: grossRevenue - platformFees,
      cancelledTrips: cancelledTrips ?? 0,
    });
    setTopRoutes(sorted);
    setLoading(false);
  };

  const statCards = [
    { label: 'Viajes publicados', value: stats.totalTrips.toString(), icon: Car, color: 'text-primary' },
    { label: 'Viajes completados', value: stats.completedTrips.toString(), icon: Car, color: 'text-accent' },
    { label: 'Reservas totales', value: stats.totalBookings.toString(), icon: Users, color: 'text-ocean-light' },
    { label: 'Usuarios registrados', value: stats.totalUsers.toString(), icon: UserCheck, color: 'text-primary' },
    { label: 'Ingresos brutos', value: `$${stats.grossRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-accent' },
    { label: `Comisión plataforma (${Math.round(PLATFORM_COMMISSION_RATE * 100)}%)`, value: `$${stats.platformFees.toLocaleString()}`, icon: TrendingUp, color: 'text-ocean-light' },
    { label: 'Pagos a choferes', value: `$${stats.driverPayouts.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600' },
    { label: 'Viajes cancelados', value: stats.cancelledTrips.toString(), icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Dashboard Admin</h1>
          <p className="text-sm text-primary-foreground/70">Datos reales de la plataforma</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando estadísticas...</p></div>
        ) : (
          <>
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

            {topRoutes.length > 0 && (
              <Card className="p-4">
                <h3 className="text-sm font-heading font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Rutas más frecuentes
                </h3>
                <div className="space-y-2">
                  {topRoutes.map((r, i) => (
                    <div key={r.route} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{i + 1}. {r.route}</span>
                      <span className="font-bold">{r.count} viajes</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4">
              <h3 className="text-sm font-heading font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-accent" /> Desglose de ingresos
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Ingresos brutos (total cobrado a pasajeros)</span><span className="font-bold">${stats.grossRevenue.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Comisión de la plataforma ({Math.round(PLATFORM_COMMISSION_RATE * 100)}%)</span><span className="font-bold text-accent">${stats.platformFees.toLocaleString()}</span></div>
                <div className="flex justify-between border-t border-border pt-1"><span className="text-muted-foreground">Total a choferes</span><span className="font-bold">${stats.driverPayouts.toLocaleString()}</span></div>
              </div>
            </Card>
          </>
        )}
      </div>

      <BottomNav role="admin" />
    </div>
  );
};

export default AdminDashboard;
