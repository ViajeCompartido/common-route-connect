import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send as SendIcon, MapPin, Clock, PawPrint } from 'lucide-react';
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

const initialMessages: Message[] = [
  { id: '1', senderId: 'd1', text: '¡Hola! Gracias por reservar. ¿Desde qué zona salís?', time: '14:02', isMe: false },
  { id: '2', senderId: 'p1', text: 'Hola! Salgo de Palermo, cerca de Plaza Italia.', time: '14:03', isMe: true },
  { id: '3', senderId: 'd1', text: 'Perfecto, te puedo pasar a buscar por Santa Fe y Scalabrini Ortiz. ¿Te queda bien?', time: '14:04', isMe: false },
  { id: '4', senderId: 'p1', text: 'Genial, ahí estaré. Llevo una mochila nada más.', time: '14:05', isMe: true },
  { id: '5', senderId: 'd1', text: 'Joya, te espero en el auto gris Volkswagen Vento, patente AB 123 CD. Nos vemos!', time: '14:06', isMe: false },
];

const Chat = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const trip = mockTrips.find(t => t.id === tripId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMsg, setNewMsg] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'p1',
      text: newMsg.trim(),
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    }]);
    setNewMsg('');
  };

  const driverName = trip?.driverName || 'Chofer';
  const driverInitial = driverName.charAt(0);

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
              {driverInitial}
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

      {/* Coordination hint */}
      <div className="max-w-lg mx-auto w-full px-4 pt-3">
        <div className="bg-accent/10 rounded-xl p-3 flex items-start gap-2">
          <PawPrint className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Usá el chat para coordinar el punto de encuentro exacto, horario, si llevás equipaje o mascota, y cualquier detalle del viaje.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 max-w-lg mx-auto w-full">
        <div className="space-y-2">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i < initialMessages.length ? i * 0.05 : 0 }}
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

      {/* Input */}
      <div className="shrink-0 border-t border-border bg-card" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <form onSubmit={handleSend} className="max-w-lg mx-auto flex items-center gap-2 px-4 py-3">
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
