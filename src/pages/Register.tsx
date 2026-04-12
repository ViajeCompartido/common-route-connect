import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, Car } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(form.email, form.password, {
      first_name: form.firstName,
      last_name: form.lastName,
      phone: form.phone,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Cuenta creada! Revisá tu email para confirmar.');
      navigate('/get-started');
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
          <h1 className="text-xl font-heading font-bold mb-1">Crear tu cuenta</h1>
          <p className="text-sm text-muted-foreground mb-6">Completá tus datos para empezar a viajar.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nombre" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="pl-10 h-12 rounded-xl" required />
              </div>
              <div>
                <Input placeholder="Apellido" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="h-12 rounded-xl" required />
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Tu email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="tel" placeholder="Tu celular" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Creá una contraseña"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="pl-10 pr-10 h-12 rounded-xl"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold text-sm">
              {isLoading ? 'Creando cuenta...' : 'Crear mi cuenta'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ¿Ya tenés cuenta?{' '}
            <button onClick={() => navigate('/login')} className="text-primary font-semibold">Iniciá sesión</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
