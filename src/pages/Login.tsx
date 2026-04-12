import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('¡Bienvenido de vuelta!');
    navigate('/');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('¡Cuenta creada! Ya podés empezar a usar la app.');
    navigate('/');
  };

  return (
    <div className="min-h-screen gradient-ocean flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-heading font-bold text-primary-foreground">ViajeCompartido</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm">Viajá entre ciudades, compartí gastos, conocé gente.</p>
        </div>

        <Card className="p-6 rounded-2xl">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="Tu email" className="pl-10 h-12 rounded-xl" required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Tu contraseña" className="pl-10 pr-10 h-12 rounded-xl" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button type="submit" className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold">Entrar</Button>
                <p className="text-xs text-center text-muted-foreground">¿Olvidaste tu contraseña? <span className="text-primary font-medium cursor-pointer">Recuperala acá</span></p>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Tu nombre completo" className="pl-10 h-12 rounded-xl" required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="email" placeholder="Tu email" className="pl-10 h-12 rounded-xl" required />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="tel" placeholder="Tu celular" className="pl-10 h-12 rounded-xl" required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="Creá una contraseña" className="pl-10 h-12 rounded-xl" required />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">¿Cómo vas a usar la app?</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('passenger')}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${role === 'passenger' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border active:bg-muted/50'}`}
                    >
                      🧑 Soy pasajero
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('driver')}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${role === 'driver' ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-border active:bg-muted/50'}`}
                    >
                      🚗 Soy chofer
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold">Crear mi cuenta</Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
