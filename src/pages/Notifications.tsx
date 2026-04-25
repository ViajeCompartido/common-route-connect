import { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Bell, CheckCircle2, XCircle, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { getLastSeenMap } from '@/hooks/useUnreadMessages';
import { getInitial } from '@/lib/avatarUtils';

interface ChatNotification {
  kind: 'chat';
  id: string;
  bookingId: string;
  otherUserId: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface SystemNotification {
  kind: 'system';
  id: string;
  type: 'booking' | 'cancellation';
  title: string;
  description: string;
  createdAt: string;
  href?: string;
}

type NotificationItem = ChatNotification | SystemNotification;

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} d`;
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const getItemDate = (n: NotificationItem) =>
  n.kind === 'chat' ? n.lastMessageAt : n.createdAt;

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
        .limit(50),
      supabase
        .from('messages')
        .select('id, content, created_at, booking_id, sender_id')
        .neq('sender_id', user.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const list: NotificationItem[] = [];

    // System notifications (bookings)
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
          kind: 'system',
          id: `b-${b.id}-${b.status}`,
          type: b.status.startsWith('cancelled') || b.status === 'rejected' ? 'cancellation' : 'booking',
          title,
          description,
          createdAt: b.updated_at,
          href: `/trip/${b.trip_id}`,
        });
      }
    });

    // Group messages by booking (one card per conversation)
    const msgs = messages ?? [];
    const lastSeen = getLastSeenMap();
    const byBooking = new Map<string, { otherUserId: string; latest: typeof msgs[number]; unread: number }>();

    for (const m of msgs) {
      const seen = lastSeen[m.booking_id];
      const isUnread = !seen || new Date(m.created_at) > new Date(seen);
      const existing = byBooking.get(m.booking_id);
      if (!existing) {
        byBooking.set(m.booking_id, {
          otherUserId: m.sender_id,
          latest: m,
          unread: isUnread ? 1 : 0,
        });
      } else {
        if (isUnread) existing.unread += 1;
        // messages are already sorted desc, so first one is latest
      }
    }

    if (byBooking.size > 0) {
      const otherUserIds = Array.from(new Set(Array.from(byBooking.values()).map(v => v.otherUserId)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', otherUserIds);
      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      byBooking.forEach((v, bookingId) => {
        const p = profileMap.get(v.otherUserId);
        const name = p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Usuario' : 'Usuario';
        list.push({
          kind: 'chat',
          id: `c-${bookingId}`,
          bookingId,
          otherUserId: v.otherUserId,
          name,
          avatarUrl: p?.avatar_url ?? null,
          lastMessage: v.latest.content,
          lastMessageAt: v.latest.created_at,
          unreadCount: v.unread,
        });
      });
    }

    list.sort((a, b) => new Date(getItemDate(b)).getTime() - new Date(getItemDate(a)).getTime());
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

  const handleClick = (n: NotificationItem) => {
    if (n.kind === 'chat') {
      navigate(`/chat/${n.bookingId}`);
    } else if (n.href) {
      navigate(n.href);
    }
  };

  const totalUnread = useMemo(
    () => items.reduce((sum, i) => sum + (i.kind === 'chat' ? i.unreadCount : 0), 0),
    [items]
  );

  return (
    <div className="min-h-screen bg-muted/30 pb-8">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            aria-label="Volver"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 active:opacity-70"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-heading font-bold text-lg flex-1">Notificaciones</h1>
          {totalUnread > 0 && (
            <span className="text-xs font-semibold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
              {totalUnread}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-3 pt-3">
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
                  onClick={() => handleClick(n)}
                  className="w-full text-left bg-card border border-border/60 rounded-2xl p-3 flex items-center gap-3 shadow-sm active:scale-[0.99] transition-transform"
                >
                  {n.kind === 'chat' ? (
                    <div className="relative shrink-0">
                      {n.avatarUrl ? (
                        <img
                          src={n.avatarUrl}
                          alt={n.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-heading font-bold flex items-center justify-center">
                          {getInitial(n.name)}
                        </div>
                      )}
                      {n.unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-card" />
                      )}
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {n.type === 'cancellation'
                        ? <XCircle className="h-6 w-6 text-destructive" />
                        : <CheckCircle2 className="h-6 w-6 text-primary" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-heading font-bold text-[15px] truncate">
                        {n.kind === 'chat' ? n.name : n.title}
                      </p>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatRelative(getItemDate(n))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-sm truncate ${n.kind === 'chat' && n.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {n.kind === 'chat' ? n.lastMessage : n.description}
                      </p>
                      {n.kind === 'chat' && n.unreadCount > 0 && (
                        <span className="shrink-0 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {n.unreadCount > 99 ? '99+' : n.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && items.length > 0 && (
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6">
            <Megaphone className="h-3.5 w-3.5" />
            Las notificaciones se eliminan automáticamente después de 30 días.
          </p>
        )}
      </main>
    </div>
  );
};

export default Notifications;
