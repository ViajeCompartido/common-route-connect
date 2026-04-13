import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send as SendIcon, MapPin, Clock, Info, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { mockTrips } from '@/data/mockData';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isMe: boolean;
}

const coordinationMessages: Message[] = [
  { id: '1', senderId: 'd1', text: '¡Hola! Te acepté la solicitud. ¿Desde qué zona salís exactamente?', time: '14:02', isMe: false },
  { id: '2', senderId: 'p1', text: 'Hola! Salgo de Palermo, cerca de Plaza Italia. ¿Te queda cómodo?', time: '14:03', isMe: true },
  { id: '3', senderId: 'd1', text: 'Sí, paso por ahí. Te puedo levantar en Santa Fe y Scalabrini Ortiz a las 8:10, ¿te sirve?', time: '14:04', isMe: false },
];

const fullMessages: Message[] = [
  { id: '1', senderId: 'd1', text: '¡Hola! Ya está todo confirmado. Mañana a las 8:10 en Santa Fe y Scalabrini Ortiz.', time: '08:15', isMe: false },
  { id: '2', senderId: 'p1', text: 'Perfecto, ahí estaré. Llevo una mochila nada más.', time: '08:16', isMe: true },
  { id: '3', senderId: 'd1', text: 'Joya. Auto gris Volkswagen Vento, patente AB 123 CD. Cualquier cosa avisame.', time: '08:17', isMe: false },
  { id: '4', senderId: 'p1', text: 'Genial, nos vemos mañana!', time: '08:18', isMe: true },
];

const quickMessages = [
  '¿Dónde nos encontramos?',
  'Voy con equipaje',
  'Voy con mascota',
  'Llego en 10 minutos',
  'Estoy en el punto de encuentro',
  '¿A qué hora salimos?',
];

const Chat = () => {
  const { tripId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trip = mockTrips.find(t => t.id === tripId);
  const isCoordination = searchParams.get('phase') === 'coordination';

  const [messages, setMessages] = useState<Message[]>(isCoordination ? coordinationMessages : fullMessages);
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || newMsg.trim();
    if (!msg) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'p1',
      text: msg,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    }]);
    setNewMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const driverName = trip?.driverName || 'Chofer';

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="gradient-ocean px-4 pt-8 pb-4 shrink-0">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-2 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center text-primary-foreground font-heading font-bold text-sm shrink-0">
              {driverName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-primary-foreground">{driverName}</p>
              {trip && (
                <div className="flex items-center gap-2 text-[10px] text-primary-foreground/60">
                  <MapPin className="h-3 w-3" />
                  <span>{trip.origin} → {trip.destination}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{trip.date}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phase banner */}
      <div className="max-w-lg mx-auto w-full px-4 pt-3">
        {isCoordination ? (
          <div className="bg-amber-500/10 rounded-xl p-3 flex items-start gap-2 border border-amber-500/20">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-amber-700">Chat de coordinación</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Coordiná punto de encuentro, horario y detalles. Cuando estés seguro/a, volvé al viaje y confirmá el pago.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-accent/10 rounded-xl p-3 flex items-start gap-2 border border-accent/20">
            <Lock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-accent">Viaje confirmado.</span> Usá el chat para coordinar detalles de último momento.
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full">
        <div className="space-y-2">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i < 4 ? i * 0.05 : 0 }}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                msg.isMe
                  ? 'gradient-accent text-primary-foreground rounded-br-md'
                  : 'bg-secondary rounded-bl-md'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[9px] mt-1 ${msg.isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Quick messages */}
      <div className="max-w-lg mx-auto w-full px-4 pb-1">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {quickMessages.map(qm => (
            <button
              key={qm}
              onClick={() => handleSend(qm)}
              className="text-[10px] px-3 py-1.5 rounded-full border border-border bg-secondary/60 whitespace-nowrap shrink-0 active:bg-primary/10 transition-colors"
            >
              {qm}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex items-center gap-2 px-4 py-3">
          <Input
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 h-11 rounded-full px-4 text-sm"
          />
          <Button type="submit" size="icon" className="h-11 w-11 rounded-full gradient-accent text-primary-foreground shrink-0">
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
