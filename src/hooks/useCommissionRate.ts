import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setCachedCommissionRate, DEFAULT_COMMISSION_RATE } from '@/lib/tripUtils';

const SETTING_KEY = 'platform_commission_rate';

export function useCommissionRate() {
  const [rate, setRate] = useState<number>(DEFAULT_COMMISSION_RATE);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .maybeSingle();
    if (data?.value != null) {
      const parsed = Number(data.value);
      if (!Number.isNaN(parsed)) {
        setRate(parsed);
        setCachedCommissionRate(parsed);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('app_settings_commission')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'app_settings',
        filter: `key=eq.${SETTING_KEY}`,
      }, (payload: any) => {
        const v = Number(payload.new?.value);
        if (!Number.isNaN(v)) {
          setRate(v);
          setCachedCommissionRate(v);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateRate = async (newPct: number): Promise<{ error: string | null }> => {
    if (newPct < 0 || newPct > 100) return { error: 'El porcentaje debe estar entre 0 y 100' };
    const decimal = newPct / 100;
    const { error } = await supabase
      .from('app_settings')
      .update({ value: decimal as any, updated_at: new Date().toISOString() })
      .eq('key', SETTING_KEY);
    if (error) return { error: error.message };
    setRate(decimal);
    setCachedCommissionRate(decimal);
    return { error: null };
  };

  return { rate, ratePercent: Math.round(rate * 10000) / 100, loading, updateRate, reload: load };
}
