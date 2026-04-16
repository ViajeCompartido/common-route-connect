import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Star, DollarSign, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateServiceFee } from '@/lib/tripUtils';
import { getAvatarFallback } from '@/lib/avatarUtils';

interface LeaderEntry {
  id: string;
  name: string;
  trips: number;
  revenue: number;
  rating: number;
}

const AdminLeaderboard = () => {
  const [drivers, setDrivers] = useState<LeaderEntry[]>([]);
  const [passengers, setPassengers] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeaderboard(); }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: bookings }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, total_trips, average_rating'),
      supabase.from('bookings').select('passenger_id, driver_id, price_per_seat, seats, pet_surcharge, status'),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    const driverIds = new Set((roles ?? []).filter(r => r.role === 'driver').map(r => r.user_id));
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

    // Aggregate booking data
    const driverRevenue: Record<string, number> = {};
    const driverTrips: Record<string, number> = {};
    const passengerSpend: Record<string, number> = {};
    const passengerTrips: Record<string, number> = {};

    (bookings ?? []).filter(b => ['completed', 'paid'].includes(b.status)).forEach(b => {
      const subtotal = Number(b.price_per_seat) * b.seats + (Number(b.pet_surcharge) || 0);
      const fee = calculateServiceFee(subtotal);

      driverRevenue[b.driver_id] = (driverRevenue[b.driver_id] || 0) + subtotal;
      driverTrips[b.driver_id] = (driverTrips[b.driver_id] || 0) + 1;

      passengerSpend[b.passenger_id] = (passengerSpend[b.passenger_id] || 0) + subtotal + fee;
      passengerTrips[b.passenger_id] = (passengerTrips[b.passenger_id] || 0) + 1;
    });

    const driverList: LeaderEntry[] = [...driverIds].map(id => {
      const p = profileMap[id];
      return {
        id,
        name: p ? `${p.first_name} ${p.last_name}` : 'Desconocido',
        trips: driverTrips[id] || 0,
        revenue: driverRevenue[id] || 0,
        rating: p ? Number(p.average_rating) : 0,
      };
    }).sort((a, b) => b.trips - a.trips).slice(0, 10);

    const passengerList: LeaderEntry[] = Object.keys(passengerTrips).map(id => {
      const p = profileMap[id];
      return {
        id,
        name: p ? `${p.first_name} ${p.last_name}` : 'Desconocido',
        trips: passengerTrips[id] || 0,
        revenue: passengerSpend[id] || 0,
        rating: p ? Number(p.average_rating) : 0,
      };
    }).sort((a, b) => b.trips - a.trips).slice(0, 10);

    setDrivers(driverList);
    setPassengers(passengerList);
    setLoading(false);
  };

  const renderList = (entries: LeaderEntry[], revenueLabel: string) => {
    if (entries.length === 0) return <p className="text-xs text-muted-foreground text-center py-8">Sin datos aún</p>;
    return (
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div key={e.id} className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-muted/50">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{e.name}</p>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Car className="h-3 w-3" /> {e.trips}</span>
                <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" /> ${e.revenue.toLocaleString()}</span>
                {e.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-500" /> {e.rating.toFixed(1)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando ranking...</p></div>;

  return (
    <Card className="p-4">
      <h3 className="text-sm font-heading font-semibold mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-500" /> Ranking de usuarios
      </h3>
      <Tabs defaultValue="drivers">
        <TabsList className="w-full">
          <TabsTrigger value="drivers" className="flex-1 text-xs">Top Choferes</TabsTrigger>
          <TabsTrigger value="passengers" className="flex-1 text-xs">Top Pasajeros</TabsTrigger>
        </TabsList>
        <TabsContent value="drivers">{renderList(drivers, 'Ingresos')}</TabsContent>
        <TabsContent value="passengers">{renderList(passengers, 'Gastado')}</TabsContent>
      </Tabs>
    </Card>
  );
};

export default AdminLeaderboard;
