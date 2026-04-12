import { Star, BadgeCheck, Car } from 'lucide-react';
import { verifiedDrivers } from '@/data/mockData';
import { motion } from 'framer-motion';

const VerifiedDrivers = () => {
  return (
    <div className="py-2">
      <h2 className="text-base font-heading font-bold mb-1">Choferes destacados</h2>
      <p className="text-xs text-muted-foreground mb-4">Perfiles verificados y con buena reputación.</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {verifiedDrivers.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="shrink-0 w-28 bg-card border border-border rounded-2xl p-3 text-center"
          >
            <div className="w-12 h-12 rounded-full gradient-ocean mx-auto flex items-center justify-center text-primary-foreground font-heading font-bold text-base mb-2">
              {d.name.charAt(0)}
            </div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs font-semibold font-heading">{d.name}</span>
              <BadgeCheck className="h-3.5 w-3.5 text-accent shrink-0" />
            </div>
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Star className="h-3 w-3 fill-accent text-accent" />
              <span className="text-xs font-bold">{d.rating}</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Car className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{d.trips} viajes</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VerifiedDrivers;
