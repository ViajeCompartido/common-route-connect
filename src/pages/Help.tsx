import { ArrowLeft, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Help = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm"><ArrowLeft className="h-4 w-4" /> Volver</button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Ayuda y contacto</h1>
          <p className="text-sm text-primary-foreground/70">¿Necesitás ayuda? Estamos para asistirte.</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="text-sm font-heading font-bold mb-3">¿Cómo podemos ayudarte?</h2>
          <div className="space-y-3">
            <button onClick={() => navigate('/faq')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors text-left">
              <HelpCircle className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Preguntas frecuentes</p>
                <p className="text-[11px] text-muted-foreground">Respuestas a las dudas más comunes.</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors text-left">
              <Mail className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">Escribinos por email</p>
                <p className="text-[11px] text-muted-foreground">soporte@viajecompartido.com.ar</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors text-left">
              <MessageCircle className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-sm font-semibold">WhatsApp</p>
                <p className="text-[11px] text-muted-foreground">Próximamente disponible.</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <h2 className="text-sm font-heading font-bold mb-2">Horario de atención</h2>
          <p className="text-sm text-muted-foreground">Lunes a viernes de 9 a 18 hs.</p>
          <p className="text-xs text-muted-foreground mt-1">Respondemos consultas dentro de las 24 hs hábiles.</p>
        </div>

        <div className="text-center pt-4">
          <Button variant="outline" className="rounded-xl" onClick={() => navigate('/faq')}>
            Ver preguntas frecuentes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Help;
