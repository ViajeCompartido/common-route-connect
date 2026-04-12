import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, ThumbsUp, Clock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Rate = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Seleccioná una calificación.');
      return;
    }
    toast.success('¡Gracias por tu calificación!');
    navigate('/my-trips');
  };

  const quickComments = [
    'Excelente viaje, muy recomendable',
    'Puntual y amable',
    'Auto cómodo y limpio',
    'Buena onda, repetiría',
    'Llegamos a horario',
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Calificar viaje</h1>
          <p className="text-sm text-primary-foreground/70">Tu opinión ayuda a toda la comunidad.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2 space-y-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Trip summary */}
          <div className="bg-card rounded-2xl p-5 border border-border mb-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground font-heading font-bold text-xl shrink-0">
                C
              </div>
              <div>
                <p className="font-semibold font-heading">Carlos Méndez</p>
                <p className="text-xs text-muted-foreground">Palermo → La Plata · 15/04/2026</p>
              </div>
            </div>

            {/* Stars */}
            <div className="text-center mb-6">
              <p className="text-sm font-medium mb-3">¿Cómo fue tu viaje?</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoveredRating(s)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        s <= (hoveredRating || rating)
                          ? 'fill-accent text-accent'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {rating === 5 ? '¡Excelente!' : rating === 4 ? 'Muy bueno' : rating === 3 ? 'Bueno' : rating === 2 ? 'Regular' : 'Malo'}
                </p>
              )}
            </div>

            {/* Quick comments */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Comentarios rápidos:</p>
              <div className="flex flex-wrap gap-2">
                {quickComments.map(qc => (
                  <button
                    key={qc}
                    type="button"
                    onClick={() => setComment(prev => prev ? `${prev}. ${qc}` : qc)}
                    className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-secondary/60 active:bg-primary/10 transition-colors"
                  >
                    {qc}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Contanos cómo fue tu experiencia..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="rounded-xl resize-none mb-4"
              rows={3}
            />

            <Button onClick={handleSubmit} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl text-sm font-semibold gap-2">
              <ThumbsUp className="h-4 w-4" /> Enviar calificación
            </Button>
          </div>
        </motion.div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default Rate;
