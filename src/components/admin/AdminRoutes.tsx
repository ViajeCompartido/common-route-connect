import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateServiceFee } from '@/lib/tripUtils';
import { normalizeRouteKey } from '@/lib/normalizeCityName';

interface RouteRow {
  route: string;
  count: number;
  revenue: number;
}

const AdminRoutes = () => {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRoutes(); }, []);

  const loadRoutes = async () => {
    setLoading(true);
    const [{ data: trips }, { data: bookings }] = await Promise.all([
      supabase.from('trips').select('id, origin, destination'),
      supabase.from('bookings').select('trip_id, price_per_seat, seats, pet_surcharge').in('status', ['completed', 'paid']),
    ]);

    const tripMap = Object.fromEntries((trips ?? []).map(t => [t.id, t]));
    const routeData: Record<string, { count: number; revenue: number }> = {};

    // Conteo de viajes por ruta normalizada
    (trips ?? []).forEach(t => {
      const key = normalizeRouteKey(t.origin, t.destination);
      if (!routeData[key]) routeData[key] = { count: 0, revenue: 0 };
      routeData[key].count++;
    });

    // Suma de ingresos
    (bookings ?? []).forEach(b => {
      const trip = tripMap[b.trip_id];
      if (!trip) return;
      const key = normalizeRouteKey(trip.origin, trip.destination);
      if (!routeData[key]) routeData[key] = { count: 0, revenue: 0 };
      const subtotal = Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0);
      routeData[key].revenue += subtotal + calculateServiceFee(subtotal);
    });

    const sorted = Object.entries(routeData)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([route, d]) => ({ route, ...d }));

    setRoutes(sorted);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando rutas...</p></div>;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-heading font-semibold mb-1 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" /> Top 10 rutas más frecuentes
      </h3>
      <p className="text-[10px] text-muted-foreground mb-4">
        Las variantes (ej. “Monte Hermoso playa”) se agrupan bajo la ciudad base.
      </p>
      {routes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Sin datos de rutas aún</p>
      ) : (
        <div className="space-y-3">
          {routes.map((r, i) => {
            const maxCount = routes[0]?.count || 1;
            const pct = (r.count / maxCount) * 100;
            return (
              <div key={r.route} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-foreground w-5 shrink-0">{i + 1}.</span>
                    <span className="truncate">{r.route}</span>
                  </span>
                  <div className="flex gap-3 text-right shrink-0">
                    <span className="font-bold">{r.count} viajes</span>
                    <span className="text-accent font-medium w-20">${r.revenue.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AdminRoutes;
