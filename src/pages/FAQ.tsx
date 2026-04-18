import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  { q: '¿Qué es WEEGO?', a: 'Es una plataforma que conecta choferes y pasajeros que comparten rutas y horarios, para viajar juntos y compartir gastos de forma segura.' },
  { q: '¿Cómo funciona para pasajeros?', a: 'Buscás viajes compatibles con tu ruta y horario, enviás una solicitud al chofer, coordinás por chat y luego pagás. También podés publicar tu necesidad de viaje para que choferes compatibles te encuentren.' },
  { q: '¿Cómo funciona para choferes?', a: 'Activás tu perfil de chofer, publicás tus viajes indicando ruta, horario y precio, y recibís solicitudes de pasajeros. Vos decidís a quién aceptar.' },
  { q: '¿Es seguro?', a: 'Verificamos la identidad y datos de los choferes. Además, el sistema de reputación y calificaciones te ayuda a elegir con quién viajar.' },
  { q: '¿Puedo viajar con mi mascota?', a: 'Sí, podés indicar que viajás con mascota y su tamaño. Solo te mostramos choferes que aceptan mascotas del tamaño que indicaste. Puede aplicarse un adicional según el tamaño.' },
  { q: '¿Cómo se calcula el precio?', a: 'El chofer define el precio por asiento. Si viajás con más personas, se multiplica por la cantidad de asientos. Si llevás mascota, puede sumarse un adicional según el tamaño.' },
  { q: '¿Qué pasa si el chofer cancela?', a: 'Si el chofer cancela después de que pagaste, se gestiona el reembolso correspondiente. Las cancelaciones afectan la reputación del usuario.' },
  { q: '¿Puedo cancelar mi solicitud?', a: 'Sí, podés cancelar en cualquier momento antes del pago. Las cancelaciones reiteradas pueden afectar tu reputación.' },
  { q: '¿Cómo se paga?', a: 'El pago se habilita después de coordinar por chat con el chofer. Próximamente integraremos Mercado Pago para pagos seguros dentro de la plataforma.' },
  { q: '¿Qué zonas cubre?', a: 'WEEGO funciona en toda Argentina. El sistema busca coincidencias por zonas y barrios cercanos, sin importar la distancia del viaje.' },
];

const FAQ = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm"><ArrowLeft className="h-4 w-4" /> Volver</button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Preguntas frecuentes</h1>
          <p className="text-sm text-primary-foreground/70">Respuestas a las dudas más comunes.</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6">
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-2xl border border-border px-4">
              <AccordionTrigger className="text-sm font-heading font-semibold text-left py-4 hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
