import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, Wallet, User, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/formatPrice';
import { REFUND_STATUS_LABEL } from '@/lib/cancellationReasons';
import { toast } from 'sonner';

interface CancellationRow {
  id: string;
  booking_id: string;
  trip_id: string;
  cancelled_by_user_id: string;
  cancelled_by_role: string;
  reason: string;
  reason_category: string | null;
  refund_percentage: number;
  refund_amount: number;
  refund_status: string;
  refund_processed_at: string | null;
  notes: string | null;
  created_at: string;
  user_name?: string;
  route?: string;
}

const AdminCancellations = () => {
  const [items, setItems] = useState<CancellationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data: cancels } = await supabase
      .from('cancellations' as any)
      .select('*')
      .order('created_at', { ascending: false });

    const list = (cancels ?? []) as unknown as CancellationRow[];

    if (list.length > 0) {
      const userIds = [...new Set(list.map(c => c.cancelled_by_user_id))];
      const tripIds = [...new Set(list.map(c => c.trip_id))];
      const [{ data: profiles }, { data: trips }] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name').in('id', userIds),
        supabase.from('trips').select('id, origin, destination').in('id', tripIds),
      ]);
      const pMap = new Map((profiles ?? []).map(p => [p.id, `${p.first_name} ${p.last_name}`.trim()]));
      const tMap = new Map((trips ?? []).map(t => [t.id, `${t.origin} → ${t.destination}`]));
      list.forEach(c => {
        c.user_name = pMap.get(c.cancelled_by_user_id) || 'Usuario';
        c.route = tMap.get(c.trip_id) || '';
      });
    }
    setItems(list);
    setLoading(false);
  };

  const markCompleted = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase.rpc('mark_refund_completed' as any, { _cancellation_id: id });
    setProcessing(null);
    if (error) { toast.error('Error al marcar como completado.'); return; }
    toast.success('Reembolso marcado como realizado.');
    load();
  };

  const pending = items.filter(c => c.refund_status === 'pending' || c.refund_status === 'processing');
  const all = items;

  const totals = {
    count: items.length,
    pendingAmount: pending.reduce((s, c) => s + Number(c.refund_amount), 0),
    completedAmount: items.filter(c => c.refund_status === 'completed').reduce((s, c) => s + Number(c.refund_amount), 0),
  };

  if (loading) {
    return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando...</p></div>;
  }

  const renderItem = (c: CancellationRow, i: number) => {
    const status = REFUND_STATUS_LABEL[c.refund_status] ?? REFUND_STATUS_LABEL.not_applicable;
    const RoleIcon = c.cancelled_by_role === 'driver' ? Car : User;
    return (
      <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
        <Card className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold truncate">{c.route}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <RoleIcon className="h-3 w-3" />
                {c.cancelled_by_role === 'driver' ? 'Chofer' : c.cancelled_by_role === 'admin' ? 'Admin' : 'Pasajero'}: {c.user_name}
              </p>
            </div>
            <Badge className={`text-[10px] rounded-full px-2 py-0.5 border ${status.color}`}>{status.label}</Badge>
          </div>

          <div className="bg-muted/50 rounded-lg p-2.5 mb-2">
            <p className="text-xs text-muted-foreground">Motivo</p>
            <p className="text-sm">{c.reason}</p>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{new Date(c.created_at).toLocaleString('es-AR')}</span>
            <span className="font-bold font-heading">
              {c.refund_percentage}% · {formatPrice(Number(c.refund_amount))}
            </span>
          </div>

          {(c.refund_status === 'pending' || c.refund_status === 'processing') && Number(c.refund_amount) > 0 && (
            <Button
              size="sm"
              className="w-full mt-3 h-9 rounded-xl gradient-accent text-primary-foreground"
              disabled={processing === c.id}
              onClick={() => markCompleted(c.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Marcar reembolso realizado
            </Button>
          )}
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-1.5 mb-1"><XCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-[10px] text-muted-foreground">Total</span></div>
          <p className="text-base font-heading font-bold">{totals.count}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1.5 mb-1"><Clock className="h-3.5 w-3.5 text-amber-600" /><span className="text-[10px] text-muted-foreground">Pendientes</span></div>
          <p className="text-base font-heading font-bold text-amber-700">{formatPrice(totals.pendingAmount)}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1.5 mb-1"><Wallet className="h-3.5 w-3.5 text-green-600" /><span className="text-[10px] text-muted-foreground">Reembolsado</span></div>
          <p className="text-base font-heading font-bold text-green-700">{formatPrice(totals.completedAmount)}</p>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="text-xs">Pendientes ({pending.length})</TabsTrigger>
          <TabsTrigger value="all" className="text-xs">Todas ({all.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-3 mt-3">
          {pending.length === 0
            ? <p className="text-center text-sm text-muted-foreground py-8">No hay reembolsos pendientes.</p>
            : pending.map(renderItem)}
        </TabsContent>
        <TabsContent value="all" className="space-y-3 mt-3">
          {all.length === 0
            ? <p className="text-center text-sm text-muted-foreground py-8">No hay cancelaciones registradas.</p>
            : all.map(renderItem)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCancellations;
