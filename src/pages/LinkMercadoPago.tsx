import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

type AccountType = 'payer' | 'collector';

interface MpAccount {
  id: string;
  account_type: string;
  mp_email: string | null;
  status: string;
}

const LinkMercadoPago = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isDriver } = useProfile();

  const typeParam = searchParams.get('type') as AccountType | null;
  const accountType: AccountType = typeParam === 'collector' ? 'collector' : 'payer';

  const [mpEmail, setMpEmail] = useState('');
  const [existing, setExisting] = useState<MpAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('mercadopago_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_type', accountType)
        .maybeSingle();
      if (data) {
        setExisting(data as MpAccount);
        setMpEmail(data.mp_email || '');
      }
      setLoading(false);
    };
    load();
  }, [user, accountType]);

  const handleSave = async () => {
    if (!user) return;
    if (!mpEmail.trim()) {
      toast.error('Ingresá tu email o alias de Mercado Pago');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await supabase
          .from('mercadopago_accounts')
          .update({ mp_email: mpEmail.trim(), status: 'active' })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('mercadopago_accounts')
          .insert({
            user_id: user.id,
            account_type: accountType,
            mp_email: mpEmail.trim(),
            status: 'active',
          });
      }
      toast.success(accountType === 'collector' ? 'Cuenta de cobro vinculada' : 'Cuenta de pago vinculada');
      navigate('/settings');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!existing) return;
    setSaving(true);
    await supabase
      .from('mercadopago_accounts')
      .update({ status: 'disconnected' })
      .eq('id', existing.id);
    toast.success('Cuenta desvinculada');
    setExisting({ ...existing, status: 'disconnected' });
    setMpEmail('');
    setSaving(false);
  };

  const isPayer = accountType === 'payer';
  const title = isPayer ? 'Vincular Mercado Pago para pagar' : 'Vincular Mercado Pago para cobrar';
  const Icon = isPayer ? CreditCard : Wallet;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary-foreground" />
            <h1 className="text-lg font-heading font-bold text-primary-foreground">{title}</h1>
          </div>
          <p className="text-sm text-primary-foreground/70 mt-1">
            {isPayer
              ? 'Vinculá tu cuenta para pagar viajes de forma segura.'
              : 'Vinculá tu cuenta para recibir los cobros de tus viajes.'}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status card */}
        {existing && existing.status === 'active' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Cuenta vinculada</p>
              <p className="text-xs text-green-600 mt-0.5">{existing.mp_email}</p>
            </div>
          </motion.div>
        )}

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-heading font-bold">¿Cómo funciona?</h3>
          {isPayer ? (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>1. Vinculás tu email o alias de Mercado Pago.</p>
              <p>2. Cuando el chofer acepte tu solicitud y coordinen el viaje, se habilita el pago.</p>
              <p>3. El pago queda <strong>retenido</strong> hasta que el viaje se complete.</p>
              <p>4. Cuando el chofer marque "Viaje finalizado", se libera el pago.</p>
              <p>5. Si se cancela el viaje, se procesa el reembolso.</p>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>1. Vinculás tu email o alias de Mercado Pago.</p>
              <p>2. Cuando un pasajero paga un viaje, el dinero queda <strong>retenido</strong>.</p>
              <p>3. Una vez que marcás "Viaje finalizado", el pago se libera a tu cuenta.</p>
              <p>4. El cobro se acredita en tu Mercado Pago automáticamente.</p>
            </div>
          )}
        </motion.div>

        {/* Info alert */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">
              Por ahora solo necesitás ingresar tu email o alias de Mercado Pago.
              La integración completa con OAuth se activará próximamente.
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mp-email" className="text-sm font-medium">
              Email o alias de Mercado Pago
            </Label>
            <Input
              id="mp-email"
              type="email"
              placeholder="tu@email.com o alias.mp"
              value={mpEmail}
              onChange={(e) => setMpEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !mpEmail.trim()}
            className="w-full h-11 rounded-xl gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {existing?.status === 'active' ? 'Actualizar cuenta' : 'Vincular cuenta'}
          </Button>

          {existing?.status === 'active' && (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={saving}
              className="w-full h-11 rounded-xl gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Desvincular cuenta
            </Button>
          )}
        </motion.div>

        {/* Payment states reference */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-heading font-bold">Estados del pago</h3>
          <div className="space-y-2">
            {[
              { label: 'Pendiente', desc: 'El pasajero aún no pagó', color: 'bg-amber-500' },
              { label: 'Pagado', desc: 'El pasajero realizó el pago', color: 'bg-blue-500' },
              { label: 'Retenido', desc: 'El pago está guardado hasta que el viaje se complete', color: 'bg-primary' },
              { label: 'Liberado', desc: 'El pago fue acreditado al chofer', color: 'bg-green-500' },
              { label: 'Reembolsado', desc: 'El pago fue devuelto al pasajero', color: 'bg-destructive' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${s.color} shrink-0`} />
                <div>
                  <p className="text-xs font-medium">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <BottomNav role={isDriver ? 'driver' : 'passenger'} />
    </div>
  );
};

export default LinkMercadoPago;
