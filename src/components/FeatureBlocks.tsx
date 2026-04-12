import { Shield, BadgeCheck, PawPrint, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: BadgeCheck,
    title: 'Choferes verificados',
    desc: 'Identidad y vehículo validados. Sabés con quién viajás.',
    gradient: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    icon: Shield,
    title: 'Pagás con confianza',
    desc: 'El pago se habilita solo si el chofer acepta tu solicitud. Nada por adelantado.',
    gradient: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
  },
  {
    icon: PawPrint,
    title: 'Viajá con tu mascota',
    desc: 'Filtrá choferes que aceptan mascotas o avisá si viajás con la tuya.',
    gradient: 'from-ocean-light/20 to-ocean-light/5',
    iconColor: 'text-ocean-light',
  },
  {
    icon: Star,
    title: 'Reputación real',
    desc: 'Estrellas, comentarios y viajes completados. Todo visible antes de reservar.',
    gradient: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
  },
];

const FeatureBlocks = () => {
  return (
    <div className="py-2">
      <h2 className="text-base font-heading font-bold mb-1">¿Por qué elegirnos?</h2>
      <p className="text-xs text-muted-foreground mb-4">Todo lo que necesitás para viajar tranquilo.</p>
      <div className="grid grid-cols-2 gap-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className={`rounded-2xl p-4 bg-gradient-to-br ${f.gradient} border border-border/50`}
          >
            <f.icon className={`h-7 w-7 ${f.iconColor} mb-2`} />
            <p className="text-xs font-bold font-heading mb-1">{f.title}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeatureBlocks;
