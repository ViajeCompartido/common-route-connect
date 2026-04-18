import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => navigate('/my-trips'), 4000);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-8 border border-border max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-9 w-9 text-accent" />
        </div>
        <h1 className="text-xl font-heading font-bold mb-2">¡Pago confirmado!</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Tu pago quedó retenido. El chofer lo recibirá una vez finalizado el viaje.
        </p>
        <Button onClick={() => navigate('/my-trips')} className="w-full gradient-accent text-primary-foreground">
          Ver mis viajes
        </Button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
