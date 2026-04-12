import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      toast.error('No pudimos cambiar la contraseña. Intentá de nuevo.');
    } else {
      setSuccess(true);
      toast.success('¡Contraseña actualizada!');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-4" />
          <h1 className="text-xl font-heading font-bold mb-2">¡Listo!</h1>
          <p className="text-sm text-muted-foreground mb-6">Tu contraseña fue actualizada correctamente.</p>
          <Button onClick={() => navigate('/')} className="gradient-accent text-primary-foreground rounded-xl">
            Ir a la app
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-ocean flex flex-col">
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Car className="h-6 w-6 text-accent" />
            <span className="text-lg font-heading font-bold text-primary-foreground">ViajeCompartido</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-background rounded-t-3xl px-4 pt-8 pb-10"
      >
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-heading font-bold mb-1">Nueva contraseña</h1>
          <p className="text-sm text-muted-foreground mb-6">Elegí una contraseña nueva para tu cuenta.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold text-sm">
              {isLoading ? 'Guardando...' : 'Guardar nueva contraseña'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
