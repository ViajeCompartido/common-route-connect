import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeRefreshOptions {
  enabled?: boolean;
  tables: string[];
  onChange: () => void | Promise<void>;
  channelName: string;
}

export function useRealtimeRefresh({ enabled = true, tables, onChange, channelName }: UseRealtimeRefreshOptions) {
  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const channel = tables.reduce((acc, table) => {
      return acc.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => void onChange()
      );
    }, supabase.channel(channelName)).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, tables, onChange, channelName]);
}