import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LAST_SEEN_KEY = 'chat_last_seen';

type LastSeenMap = Record<string, string>;

export function getLastSeenMap(): LastSeenMap {
  try {
    return JSON.parse(localStorage.getItem(LAST_SEEN_KEY) || '{}');
  } catch {
    return {};
  }
}

export function markBookingSeen(bookingId: string) {
  const map = getLastSeenMap();
  map[bookingId] = new Date().toISOString();
  localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event('chat-seen-updated'));
}

interface UnreadInfo {
  totalUnread: number;
  unreadByBooking: Record<string, number>;
}

export function useUnreadMessages(): UnreadInfo & { refresh: () => void } {
  const { user } = useAuth();
  const [info, setInfo] = useState<UnreadInfo>({ totalUnread: 0, unreadByBooking: {} });
  const [lastNotifiedAt, setLastNotifiedAt] = useState<string>(() => new Date().toISOString());

  const refresh = useCallback(async () => {
    if (!user) {
      setInfo({ totalUnread: 0, unreadByBooking: {} });
      return;
    }

    // Get all bookings where user is participant
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .or(`passenger_id.eq.${user.id},driver_id.eq.${user.id}`);

    if (!bookings || bookings.length === 0) {
      setInfo({ totalUnread: 0, unreadByBooking: {} });
      return;
    }

    const bookingIds = bookings.map(b => b.id);
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, booking_id, sender_id, created_at, content')
      .in('booking_id', bookingIds)
      .neq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (!msgs) return;

    const lastSeen = getLastSeenMap();
    const unreadByBooking: Record<string, number> = {};
    let total = 0;
    const newMessages: typeof msgs = [];

    for (const m of msgs) {
      const seen = lastSeen[m.booking_id];
      if (!seen || new Date(m.created_at) > new Date(seen)) {
        unreadByBooking[m.booking_id] = (unreadByBooking[m.booking_id] || 0) + 1;
        total++;
        if (new Date(m.created_at) > new Date(lastNotifiedAt)) {
          newMessages.push(m);
        }
      }
    }

    // Toast for genuinely new messages (only the most recent one)
    if (newMessages.length > 0) {
      const latest = newMessages[0];
      toast('💬 Nuevo mensaje', {
        description: latest.content.slice(0, 80),
      });
      setLastNotifiedAt(new Date().toISOString());
    }

    setInfo({ totalUnread: total, unreadByBooking });
  }, [user, lastNotifiedAt]);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, 5000);
    const handler = () => refresh();
    window.addEventListener('chat-seen-updated', handler);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('chat-seen-updated', handler);
    };
  }, [refresh]);

  return { ...info, refresh };
}
