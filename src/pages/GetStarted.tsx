import { useNavigate } from 'react-router-dom';
import { Search, Hand, Car, ArrowRight, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const options = [
  {
    icon: Search,
    title: 'Buscar viajes',
    desc: 'Encontrá choferes que van a donde necesitás ir.',
    path: '/search',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Hand,
    title: 'Necesito viajar',
    desc: 'Publicá tu necesidad y te conectamos con choferes compatibles.',
    path: '/need-ride',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Car,
    title: 'Publicar un viaje',
    desc: 'Sos chofer y querés compartir tu viaje. Necesitás completar tus datos de conductor.',
    path: '/activate-driver',
    color: 'text-foreground',
    bg: 'bg-secondary',
  },
];

const GetStarted = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-muted-foreground mb-4 text-sm active:opacity-70"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </button>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-12 h-12 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-heading font-bold mb-2">¿Qué querés hacer?</h1>
          <p className="text-sm text-muted-foreground">Elegí cómo querés usar WEEGO. Después podés cambiar cuando quieras.</p>
        </motion.div>

        <div className="space-y-3">
          {options.map((opt, i) => (
            <motion.button
              key={opt.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              onClick={() => navigate(opt.path)}
              className="w-full bg-card border border-border rounded-2xl p-5 text-left active:scale-[0.98] transition-all flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl ${opt.bg} flex items-center justify-center shrink-0`}>
                <opt.icon className={`h-6 w-6 ${opt.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-bold">{opt.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/')}
          className="w-full text-center text-sm text-primary font-medium mt-8 active:opacity-70"
        >
          Explorar la app primero
        </motion.button>
      </div>
    </div>
  );
};

export default GetStarted;
