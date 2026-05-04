import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setCachedCommissionRate } from '@/lib/tripUtils';

const SETTING_KEY = 'platform_commission_rate';

/**
 * Loads the global commission rate from app_settings on mount and keeps it
 * in sync via realtime. Renders nothing.
 */
const CommissionRateBootstrap = () => {
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', SETTING_KEY)
        .maybeSingle();
      if (!mounted) return;
      const v = Number(data?.value);
      if (!Number.isNaN(v)) setCachedCommissionRate(v);
    })();

    const channel = supabase
      .channel('app_settings_global_commission')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'app_settings',
        filter: `key=eq.${SETTING_KEY}`,
      }, (payload: any) => {
        const v = Number(payload.new?.value);
        if (!Number.isNaN(v)) setCachedCommissionRate(v);
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return null;
};

export default CommissionRateBootstrap;
