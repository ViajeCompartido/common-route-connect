import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Bell, MessageCircle, CheckCircle2, XCircle, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';

interface NotificationItem {
  id: string;
  type: 'message' | 'booking' | 'cancellation';
  title: string;
  description: string;
  createdAt: string;
  href?: string;
}

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();

    const [{ data: bookings }, { data: messages }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, status, created_at, updated_at, trip_id, passenger_id, driver_id, cancellation_reason')
        .or(`passenger_id.eq.${user.id},driver_id.eq.${user.id}`)
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })
        .limit(30),
      supabase
        .from('messages')
        .select('id, content, created_at, booking_id, sender_id')
        .neq('sender_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    const list: NotificationItem[] = [];

    (bookings ?? []).forEach((b) => {
      const isPassenger = b.passenger_id === user.id;
      let title = '';
      let description = '';
      switch (b.status) {
        case 'pending':
          if (!isPassenger) { title = 'Nueva solicitud de reserva'; description = 'Un pasajero quiere reservar tu viaje'; }
          break;
        case 'accepted':
          if (isPassenger) { title = 'Reserva aceptada'; description = 'El chofer aceptó tu reserva'; }
          break;
        case 'paid':
          if (!isPassenger) { title = 'Pago recibido'; description = 'Un pasajero confirmó el pago'; }
          else { title = 'Pago confirmado'; description = 'Tu reserva está confirmada'; }
          break;
        case 'cancelled_passenger':
          if (!isPassenger) { title = 'Reserva cancelada'; description = b.cancellation_reason ?? 'El pasajero canceló'; }
          break;
        case 'cancelled_driver':
          if (isPassenger) { title = 'Viaje cancelado por el chofer'; description = b.cancellation_reason ?? 'El chofer canceló'; }
          break;
        case 'rejected':
          if (isPassenger) { title = 'Reserva rechazada'; description = 'El chofer rechazó tu solicitud'; }
          break;
      }
      if (title) {
        list.push({
          id: `b-${b.id}-${b.status}`,
          type: b.status.startsWith('cancelled') || b.status === 'rejected' ? 'cancellation' : 'booking',
          title,
          description,
          createdAt: b.updated_at,
          href: `/trip/${b.trip_id}`,
        });
      }
    });

    (messages ?? []).forEach((m) => {
      list.push({
        id: `m-${m.id}`,
        type: 'message',
        title: 'Nuevo mensaje',
        description: m.content.slice(0, 80),
        createdAt: m.created_at,
        href: `/chat/${m.booking_id}`,
      });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setItems(list.slice(0, 50));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  useRealtimeRefresh({
    enabled: !!user,
    tables: ['bookings', 'messages'],
    onChange: load,
    channelName: 'notifications-refresh',
  });

  const iconFor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'message': return <MessageCircle className="h-5 w-5 text-primary" />;
      case 'cancellation': return <XCircle className="h-5 w-5 text-destructive" />;
      default: return <CheckCircle2 className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            aria-label="Volver"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 active:opacity-70"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading font-bold text-lg">Notificaciones</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-12">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-heading font-bold">Sin notificaciones</p>
            <p className="text-sm text-muted-foreground mt-1">Te avisaremos cuando haya novedades.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => n.href && navigate(n.href)}
                  className="w-full text-left bg-card border border-border rounded-2xl p-3 flex gap-3 active:scale-[0.99] transition-transform"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {iconFor(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{n.title}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">{formatRelative(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};

export default Notifications;
