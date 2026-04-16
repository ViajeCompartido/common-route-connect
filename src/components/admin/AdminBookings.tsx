import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { calculateServiceFee } from '@/lib/tripUtils';

interface BookingRow {
  id: string;
  trip_id: string;
  passenger_id: string;
  driver_id: string;
  passengerName: string;
  driverName: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  status: string;
  price_per_seat: number;
  seats: number;
  pet_surcharge: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-cyan-100 text-cyan-800',
  coordinating: 'bg-indigo-100 text-indigo-800',
  cancelled_passenger: 'bg-red-100 text-red-800',
  cancelled_driver: 'bg-red-100 text-red-800',
  rejected: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  completed: 'Completado',
  paid: 'Pagado',
  pending: 'Pendiente',
  accepted: 'Aceptado',
  coordinating: 'Coordinando',
  cancelled_passenger: 'Cancel. pasajero',
  cancelled_driver: 'Cancel. chofer',
  rejected: 'Rechazado',
  driver_on_way: 'En camino',
  driver_arrived: 'Llegó',
  in_transit: 'En viaje',
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadBookings(); }, []);

  const loadBookings = async () => {
    setLoading(true);
    const { data: bks } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(500);

    if (!bks || bks.length === 0) { setBookings([]); setLoading(false); return; }

    const tripIds = [...new Set(bks.map(b => b.trip_id))];
    const userIds = [...new Set(bks.flatMap(b => [b.passenger_id, b.driver_id]))];

    const [{ data: trips }, { data: profiles }] = await Promise.all([
      supabase.from('trips').select('id, origin, destination, date, time').in('id', tripIds),
      supabase.from('profiles').select('id, first_name, last_name').in('id', userIds),
    ]);

    const tripMap = Object.fromEntries((trips ?? []).map(t => [t.id, t]));
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, `${p.first_name} ${p.last_name}`]));

    const mapped: BookingRow[] = bks.map(b => {
      const trip = tripMap[b.trip_id];
      return {
        ...b,
        pet_surcharge: Number(b.pet_surcharge) || 0,
        passengerName: profileMap[b.passenger_id] || 'Desconocido',
        driverName: profileMap[b.driver_id] || 'Desconocido',
        origin: trip?.origin || '-',
        destination: trip?.destination || '-',
        date: trip?.date || '-',
        time: trip?.time || '-',
      };
    });
    setBookings(mapped);
    setLoading(false);
  };

  const filtered = bookings.filter(b => {
    const matchSearch = search === '' ||
      b.passengerName.toLowerCase().includes(search.toLowerCase()) ||
      b.driverName.toLowerCase().includes(search.toLowerCase()) ||
      b.origin.toLowerCase().includes(search.toLowerCase()) ||
      b.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando reservas...</p></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por pasajero, chofer u origen/destino..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-xs h-9" />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {['all', 'pending', 'accepted', 'coordinating', 'paid', 'completed', 'cancelled_passenger', 'cancelled_driver'].map(s => (
          <Button key={s} variant={filterStatus === s ? 'default' : 'outline'} size="sm" className="text-[10px] h-6 px-2"
            onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'Todos' : statusLabels[s] || s}
          </Button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px]">Pasajero</TableHead>
              <TableHead className="text-[10px]">Chofer</TableHead>
              <TableHead className="text-[10px]">Ruta</TableHead>
              <TableHead className="text-[10px]">Fecha</TableHead>
              <TableHead className="text-[10px]">Estado</TableHead>
              <TableHead className="text-[10px]">Monto</TableHead>
              <TableHead className="text-[10px]">Comisión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">Sin reservas</TableCell></TableRow>
            ) : filtered.map(b => {
              const subtotal = b.price_per_seat * b.seats + b.pet_surcharge;
              const fee = calculateServiceFee(subtotal);
              return (
                <TableRow key={b.id}>
                  <TableCell className="text-[10px]">{b.passengerName}</TableCell>
                  <TableCell className="text-[10px]">{b.driverName}</TableCell>
                  <TableCell className="text-[10px]">{b.origin} → {b.destination}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">{b.date !== '-' ? new Date(b.date + 'T00:00').toLocaleDateString('es-AR') : '-'}</TableCell>
                  <TableCell>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusColors[b.status] || 'bg-gray-100'}`}>
                      {statusLabels[b.status] || b.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-[10px] font-medium">${(subtotal + fee).toLocaleString()}</TableCell>
                  <TableCell className="text-[10px] text-accent font-medium">${fee.toLocaleString()}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <p className="text-[10px] text-muted-foreground text-right">{filtered.length} reservas</p>
    </div>
  );
};

export default AdminBookings;
