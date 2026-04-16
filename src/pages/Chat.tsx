import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Send as SendIcon, MapPin, Clock, Info, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getInitial } from '@/lib/avatarUtils';
import { toast } from 'sonner';

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  isMe: boolean;
}

interface BookingChatData {
  id: string;
  status: string;
  passenger_id: string;
  driver_id: string;
  trips: {
    origin: string;
    destination: string;
    date: string;
    time: string;
  } | null;
}

const quickMessages = [
  '¿Dónde nos encontramos?',
  'Voy con equipaje',
  'Voy con mascota',
  'Llego en 10 minutos',
  'Estoy en el punto de encuentro',
  '¿A qué hora salimos?',
];

const Chat = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCoordination = searchParams.get('phase') === 'coordination';
  const phase = isCoordination ? 'pre_payment' : 'post_payment';

  const [booking, setBooking] = useState<BookingChatData | null>(null);
  const [contactName, setContactName] = useState('Contacto');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChat = async (showLoading = false) => {
    if (!bookingId || !user) return;
    if (showLoading) setLoading(true);

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('id, status, passenger_id, driver_id, trips(origin, destination, date, time)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !bookingData) {
      if (showLoading) setLoading(false);
      return;
    }

    const normalizedBooking = bookingData as unknown as BookingChatData;
    setBooking(normalizedBooking);

    const otherUserId = normalizedBooking.passenger_id === user.id ? normalizedBooking.driver_id : normalizedBooking.passenger_id;

    const [{ data: profileData }, { data: messagesData, error: messagesError }] = await Promise.all([
      supabase.from('profiles').select('first_name, last_name').eq('id', otherUserId).maybeSingle(),
      supabase.from('messages').select('id, sender_id, content, created_at').eq('booking_id', bookingId).eq('phase', phase).order('created_at', { ascending: true }),
    ]);

    if (messagesError) {
      console.error(messagesError);
    }

    setContactName(profileData ? `${profileData.first_name} ${profileData.last_name}`.trim() || 'Contacto' : 'Contacto');
    setMessages((messagesData ?? []).map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      text: message.content,
      time: new Date(message.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      isMe: message.sender_id === user.id,
    })));

    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    loadChat(true);
  }, [bookingId, user?.id, phase]);

  useEffect(() => {
    if (!bookingId || !user) return;

    const interval = window.setInterval(() => {
      loadChat();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [bookingId, user?.id, phase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    if (!bookingId || !user) return;
    const msg = text || newMsg.trim();
    if (!msg) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: user.id,
      content: msg,
      phase,
    });

    if (error) {
      console.error(error);
      toast.error('No se pudo enviar el mensaje.');
      setSending(false);
      return;
    }

    setNewMsg('');
    setSending(false);
    loadChat();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Cargando chat...</p></div>;
  }

  if (!booking) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-sm text-muted-foreground">No encontramos este chat.</p></div>;
  }

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
              {getInitial(contactName)}
            </div>
            <div>
              <p className="text-sm font-heading font-bold text-primary-foreground">{contactName}</p>
              {booking.trips && (
                <div className="flex items-center gap-2 text-[10px] text-primary-foreground/60">
                  <MapPin className="h-3 w-3" />
                  <span>{booking.trips.origin} → {booking.trips.destination}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{booking.trips.date}</span>
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
          {messages.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Todavía no hay mensajes en esta etapa del viaje.
            </div>
          )}
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
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending} className="h-11 w-11 rounded-full gradient-accent text-primary-foreground shrink-0">
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
