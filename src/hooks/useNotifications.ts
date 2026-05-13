import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data ?? []) as any);
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => void load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const unreadCount = items.filter(i => !i.read).length;

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications' as any).update({ read: true }).eq('id', id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, read: true } : i));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await supabase.from('notifications' as any).update({ read: true }).eq('user_id', user.id).eq('read', false);
    setItems(prev => prev.map(i => ({ ...i, read: true })));
  }, [user]);

  return { items, loading, unreadCount, markAsRead, markAllAsRead, reload: load };
}
