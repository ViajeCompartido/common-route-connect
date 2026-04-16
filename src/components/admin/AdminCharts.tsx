import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { calculateServiceFee } from '@/lib/tripUtils';

interface DayData { day: string; label: string; value: number; }

const AdminCharts = () => {
  const [tripsByDay, setTripsByDay] = useState<DayData[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<DayData[]>([]);
  const [usersByDay, setUsersByDay] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCharts(); }, []);

  const getLast30Days = () => {
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const loadCharts = async () => {
    setLoading(true);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    const [{ data: trips }, { data: bookings }, { data: profiles }] = await Promise.all([
      supabase.from('trips').select('created_at').gte('created_at', since),
      supabase.from('bookings').select('created_at, price_per_seat, seats, pet_surcharge, status').gte('created_at', since),
      supabase.from('profiles').select('created_at').gte('created_at', since),
    ]);

    const days = getLast30Days();
    const tripCount: Record<string, number> = {};
    const revCount: Record<string, number> = {};
    const userCount: Record<string, number> = {};

    days.forEach(d => { tripCount[d] = 0; revCount[d] = 0; userCount[d] = 0; });

    (trips ?? []).forEach(t => {
      const d = t.created_at.split('T')[0];
      if (tripCount[d] !== undefined) tripCount[d]++;
    });

    (bookings ?? []).filter(b => ['completed', 'paid'].includes(b.status)).forEach(b => {
      const d = b.created_at.split('T')[0];
      if (revCount[d] !== undefined) {
        const subtotal = Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0);
        revCount[d] += subtotal + calculateServiceFee(subtotal);
      }
    });

    (profiles ?? []).forEach(p => {
      const d = p.created_at.split('T')[0];
      if (userCount[d] !== undefined) userCount[d]++;
    });

    const fmt = (d: string) => {
      const [, m, day] = d.split('-');
      return `${day}/${m}`;
    };

    setTripsByDay(days.map(d => ({ day: d, label: fmt(d), value: tripCount[d] })));
    setRevenueByDay(days.map(d => ({ day: d, label: fmt(d), value: revCount[d] })));
    setUsersByDay(days.map(d => ({ day: d, label: fmt(d), value: userCount[d] })));
    setLoading(false);
  };

  if (loading) return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando gráficos...</p></div>;

  const chartConfig = [
    { title: 'Viajes por día (últimos 30 días)', icon: BarChart3, data: tripsByDay, color: 'hsl(var(--primary))' },
    { title: 'Ingresos por día (últimos 30 días)', icon: TrendingUp, data: revenueByDay, color: 'hsl(var(--accent))' },
    { title: 'Usuarios nuevos por día (últimos 30 días)', icon: Users, data: usersByDay, color: 'hsl(var(--primary))' },
  ];

  return (
    <div className="space-y-4">
      {chartConfig.map(c => (
        <Card key={c.title} className="p-4">
          <h3 className="text-xs font-heading font-semibold mb-3 flex items-center gap-2">
            <c.icon className="h-4 w-4 text-primary" /> {c.title}
          </h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={c.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 8 }} interval={4} />
                <YAxis tick={{ fontSize: 9 }} width={35} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid hsl(var(--border))' }}
                  labelFormatter={(l) => `Fecha: ${l}`}
                  formatter={(v: number) => [c.data === chartConfig[1].data ? `$${v.toLocaleString()}` : v, '']}
                />
                <Bar dataKey="value" fill={c.color} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AdminCharts;
