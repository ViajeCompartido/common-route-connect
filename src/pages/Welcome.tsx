import { useNavigate } from 'react-router-dom';
import { Car, Shield, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-ocean flex flex-col items-center justify-between px-6 py-10">
      {/* Top section */}
      <div />

      {/* Center content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-3xl gradient-accent flex items-center justify-center mx-auto mb-6 shadow-ocean"
        >
          <Car className="h-10 w-10 text-primary-foreground" />
        </motion.div>

        <h1 className="text-3xl font-heading font-bold text-primary-foreground mb-3">
          ViajeCompartido
        </h1>
        <p className="text-primary-foreground/90 text-base leading-relaxed mb-8">
          Encontrá choferes y pasajeros que van a donde vos vas. Compartí gastos, viajá seguro.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: Shield, label: 'Choferes verificados' },
            { icon: Users, label: 'Coincidencias flexibles' },
            { icon: MapPin, label: 'Zonas cercanas' },
          ].map((feat, i) => (
            <motion.div
              key={feat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-1.5 bg-primary-foreground/15 backdrop-blur-sm rounded-full px-3.5 py-2 border border-primary-foreground/10"
            >
              <feat.icon className="h-3.5 w-3.5 text-accent-foreground drop-shadow-sm" style={{ color: 'hsl(var(--ocean-bright))' }} />
              <span className="text-xs text-primary-foreground font-medium">{feat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={() => navigate('/register')}
          className="w-full h-14 gradient-accent text-primary-foreground rounded-2xl text-base font-semibold shadow-ocean"
        >
          Crear cuenta
        </Button>
        <Button
          onClick={() => navigate('/login')}
          variant="outline"
          className="w-full h-14 rounded-2xl text-base font-semibold bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/25"
        >
          Ya tengo cuenta
        </Button>
        <p className="text-center text-primary-foreground/60 text-[11px] mt-4">
          Al crear una cuenta aceptás los términos y condiciones
        </p>
      </motion.div>
    </div>
  );
};

export default Welcome;
