import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import weegoLogo from '@/assets/weego-logo.png';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error('Tenés que aceptar los términos y condiciones para continuar.');
      return;
    }
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
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already')) {
        toast.error('Este email ya tiene una cuenta en WEEGO. Si olvidaste tu contraseña, tocá "Recuperar contraseña".');
      } else if (msg.includes('invalid email')) {
        toast.error('El email ingresado no es válido.');
      } else if (msg.includes('password')) {
        toast.error('La contraseña no cumple los requisitos mínimos.');
      } else {
        toast.error('No pudimos crear la cuenta. Intentá de nuevo.');
      }
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
          <div className="flex flex-col items-center gap-2 mb-1">
            <img src={weegoLogo} alt="WEEGO" className="h-20 w-20 object-contain bg-primary-foreground rounded-2xl p-2 shadow-ocean" />
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-background rounded-t-3xl px-4 pt-8 pb-10">
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

            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={v => setAcceptedTerms(v === true)} className="mt-1" />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Acepto los{' '}
                <button type="button" onClick={() => navigate('/terms')} className="text-primary font-semibold underline">términos y condiciones</button>
                {' '}y la{' '}
                <button type="button" onClick={() => navigate('/privacy')} className="text-primary font-semibold underline">política de privacidad</button>
              </label>
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
