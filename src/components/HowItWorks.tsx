import { Search, Send, CheckCircle2, CreditCard, MessageCircle, Car, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { icon: Search, label: 'Buscá un viaje', desc: 'Elegí de dónde salís, a dónde vas y cuándo querés viajar.', color: 'bg-primary/10 text-primary' },
  { icon: Send, label: 'Reservá tu lugar', desc: 'Mandale una solicitud al chofer. Sin compromiso.', color: 'bg-ocean-light/10 text-ocean-light' },
  { icon: CheckCircle2, label: 'Esperá la confirmación del chofer', desc: 'El chofer revisa tu perfil y te confirma o rechaza.', color: 'bg-accent/10 text-accent' },
  { icon: CreditCard, label: 'Pagá solo si te aceptan', desc: 'El pago se habilita recién cuando el chofer te confirma.', color: 'bg-primary/10 text-primary' },
  { icon: MessageCircle, label: 'Coordiná por chat', desc: 'Después de pagar se abre el chat para acordar punto de encuentro, equipaje o mascotas.', color: 'bg-ocean-light/10 text-ocean-light' },
  { icon: Car, label: 'Viajá tranquilo', desc: 'Compartí el viaje, dividí los gastos y llegá a destino.', color: 'bg-accent/10 text-accent' },
  { icon: Star, label: 'Dejá tu opinión', desc: 'Al llegar, chofer y pasajero se califican mutuamente.', color: 'bg-primary/10 text-primary' },
];

const HowItWorks = () => {
  return (
    <div className="py-2">
      <h2 className="text-base font-heading font-bold mb-1">¿Cómo funciona?</h2>
      <p className="text-xs text-muted-foreground mb-4">Simple, seguro y en pocos pasos.</p>
      <div className="space-y-0.5">
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="flex items-start gap-3"
          >
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.color} shrink-0`}>
                <step.icon className="h-5 w-5" />
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 h-5 bg-border" />
              )}
            </div>
            <div className="flex-1 pt-1 pb-2">
              <p className="text-sm font-semibold font-heading leading-tight">{step.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
