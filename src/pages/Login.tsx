import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      toast.error('Email o contraseña incorrectos.');
    } else {
      toast.success('¡Bienvenido de vuelta!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen gradient-ocean flex flex-col">
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => navigate('/welcome')} className="flex items-center gap-1 text-primary-foreground/70 mb-4 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
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
          <h1 className="text-xl font-heading font-bold mb-1">Iniciá sesión</h1>
          <p className="text-sm text-muted-foreground mb-6">Ingresá con tu email y contraseña.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Tu email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" required />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 rounded-xl"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="text-right">
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-primary font-medium active:opacity-70">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold text-sm">
              {isLoading ? 'Ingresando...' : 'Entrar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿No tenés cuenta?{' '}
            <button onClick={() => navigate('/register')} className="text-primary font-semibold">Crear cuenta</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
