import { Search, Send, CheckCircle2, CreditCard, MessageCircle, MapPin, Car, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { icon: Search, label: 'Buscá tu viaje', desc: 'Elegí origen, destino y fecha', color: 'bg-primary/10 text-primary' },
  { icon: Send, label: 'Solicitá reserva', desc: 'Enviá tu solicitud al chofer', color: 'bg-ocean-light/10 text-ocean-light' },
  { icon: CheckCircle2, label: 'El chofer acepta', desc: 'El chofer revisa y acepta tu solicitud', color: 'bg-accent/10 text-accent' },
  { icon: CreditCard, label: 'Pagá tu asiento', desc: 'Solo pagás cuando el chofer acepta', color: 'bg-primary/10 text-primary' },
  { icon: MessageCircle, label: 'Coordiná por chat', desc: 'Punto de encuentro, horario y detalles', color: 'bg-ocean-light/10 text-ocean-light' },
  { icon: Car, label: 'Viajá tranquilo', desc: 'Disfrutá el viaje compartido', color: 'bg-accent/10 text-accent' },
  { icon: Star, label: 'Calificá', desc: 'Ambos se califican al llegar', color: 'bg-primary/10 text-primary' },
];

const HowItWorks = () => {
  return (
    <div className="py-2">
      <h2 className="text-base font-heading font-bold mb-4">¿Cómo funciona?</h2>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.color} shrink-0`}>
                <step.icon className="h-5 w-5" />
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 h-4 bg-border" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm font-semibold font-heading">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0 hidden" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
