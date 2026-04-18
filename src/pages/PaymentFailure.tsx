import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const PaymentFailure = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl p-8 border border-border max-w-sm w-full text-center"
      >
        <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-9 w-9 text-destructive" />
        </div>
        <h1 className="text-xl font-heading font-bold mb-2">No pudimos procesar el pago</h1>
        <p className="text-sm text-muted-foreground mb-6">
          El pago fue rechazado o cancelado. Podés reintentarlo desde tu reserva.
        </p>
        <div className="flex flex-col gap-2">
          <Button onClick={() => navigate('/my-trips')} className="w-full">
            Ir a mis viajes
          </Button>
          <Button onClick={() => navigate('/')} variant="ghost" className="w-full">
            Volver al inicio
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailure;
