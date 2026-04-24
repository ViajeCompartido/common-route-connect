import { motion } from 'framer-motion';
import { MapPin, Maximize2 } from 'lucide-react';

interface TripRouteMapProps {
  origin: string;
  destination: string;
  vehicleColor?: string | null;
  onExpand?: () => void;
}

// Map common color names (Spanish/English) to hex
const COLOR_MAP: Record<string, string> = {
  rojo: '#dc2626', red: '#dc2626',
  azul: '#2563eb', blue: '#2563eb',
  negro: '#1f2937', black: '#1f2937',
  blanco: '#f8fafc', white: '#f8fafc',
  gris: '#6b7280', grey: '#6b7280', gray: '#6b7280',
  plata: '#cbd5e1', silver: '#cbd5e1',
  verde: '#16a34a', green: '#16a34a',
  amarillo: '#eab308', yellow: '#eab308',
  naranja: '#ea580c', orange: '#ea580c',
  marrón: '#92400e', marron: '#92400e', brown: '#92400e',
  beige: '#d6c7a1',
  bordó: '#7f1d1d', bordo: '#7f1d1d', burgundy: '#7f1d1d',
  celeste: '#0ea5e9',
  violeta: '#7c3aed', purple: '#7c3aed',
};

function resolveVehicleColor(input?: string | null): string {
  const fallback = 'hsl(var(--primary))';
  if (!input) return fallback;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('#') || trimmed.startsWith('hsl') || trimmed.startsWith('rgb')) return input;
  return COLOR_MAP[trimmed] ?? fallback;
}

const TripRouteMap = ({ origin, destination, vehicleColor, onExpand }: TripRouteMapProps) => {
  const carColor = resolveVehicleColor(vehicleColor);

  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-slate-800 dark:to-slate-900">
      {/* Stylized map background */}
      <svg viewBox="0 0 400 180" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* Water area */}
        <rect width="400" height="180" fill="hsl(195 70% 92%)" />
        {/* Land mass */}
        <path
          d="M0,0 L400,0 L400,110 Q340,125 280,118 Q220,112 160,125 Q100,138 40,128 Q20,124 0,130 Z"
          fill="hsl(60 30% 94%)"
        />
        {/* Roads (subtle) */}
        <path d="M-10,90 Q120,70 220,95 T410,80" stroke="hsl(45 30% 80%)" strokeWidth="6" fill="none" />
        <path d="M50,30 L80,160" stroke="hsl(45 30% 85%)" strokeWidth="3" fill="none" />
        <path d="M250,20 L280,160" stroke="hsl(45 30% 85%)" strokeWidth="3" fill="none" />

        {/* Trip route - solid green path */}
        <path
          id="trip-route"
          d="M30,60 Q120,40 200,80 T370,110"
          stroke="hsl(var(--primary))"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Animated car along route */}
        <motion.g
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: ['10%', '70%', '10%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            offsetPath: 'path("M30,60 Q120,40 200,80 T370,110")',
            offsetRotate: 'auto',
          }}
        >
          {/* Car body */}
          <rect x="-10" y="-5" width="20" height="10" rx="2.5" fill={carColor} stroke="hsl(var(--foreground))" strokeWidth="0.6" />
          {/* Windows */}
          <rect x="-6" y="-3.5" width="5" height="3" rx="0.8" fill="hsl(195 70% 80%)" opacity="0.85" />
          <rect x="1" y="-3.5" width="5" height="3" rx="0.8" fill="hsl(195 70% 80%)" opacity="0.85" />
          {/* Wheels */}
          <circle cx="-6" cy="5" r="1.6" fill="hsl(var(--foreground))" />
          <circle cx="6" cy="5" r="1.6" fill="hsl(var(--foreground))" />
        </motion.g>
      </svg>

      {/* Origin pin */}
      <div className="absolute top-3 left-3 bg-card rounded-lg shadow-md px-2 py-1 flex items-center gap-1.5 max-w-[45%]">
        <div className="w-2 h-2 rounded-full bg-primary border border-primary/40 shrink-0" />
        <div className="min-w-0">
          <p className="text-[8px] text-muted-foreground leading-none">Salida</p>
          <p className="text-[11px] font-semibold leading-tight truncate">{origin}</p>
        </div>
      </div>

      {/* Destination pin */}
      <div className="absolute bottom-3 right-3 bg-card rounded-lg shadow-md px-2 py-1 flex items-center gap-1.5 max-w-[45%]">
        <MapPin className="h-3 w-3 text-accent shrink-0 fill-accent/30" />
        <div className="min-w-0">
          <p className="text-[8px] text-muted-foreground leading-none">Llegada</p>
          <p className="text-[11px] font-semibold leading-tight truncate">{destination}</p>
        </div>
      </div>

      {/* Expand button */}
      {onExpand && (
        <button
          onClick={onExpand}
          className="absolute bottom-3 left-3 bg-card rounded-lg shadow-md px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-medium active:opacity-70"
        >
          <Maximize2 className="h-3 w-3" /> Ver ruta completa
        </button>
      )}
    </div>
  );
};

export default TripRouteMap;
