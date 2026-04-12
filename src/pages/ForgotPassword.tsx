import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await resetPassword(email);
    setIsLoading(false);

    if (error) {
      toast.error('No pudimos enviar el email. Verificá que la dirección sea correcta.');
    } else {
      setSent(true);
      toast.success('¡Email enviado! Revisá tu bandeja de entrada.');
    }
  };

  return (
    <div className="min-h-screen gradient-ocean flex flex-col">
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => navigate('/login')} className="flex items-center gap-1 text-primary-foreground/70 mb-4 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver al login
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
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-xl font-heading font-bold mb-2">Revisá tu email</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Te enviamos un link a <strong>{email}</strong> para que puedas crear una nueva contraseña.
              </p>
              <Button onClick={() => navigate('/login')} variant="outline" className="rounded-xl">
                Volver al login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-heading font-bold mb-1">Recuperar contraseña</h1>
              <p className="text-sm text-muted-foreground mb-6">Ingresá tu email y te enviamos un link para crear una nueva contraseña.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="Tu email" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl" required />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold text-sm">
                  {isLoading ? 'Enviando...' : 'Enviar link de recuperación'}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
