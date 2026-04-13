import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('first_name, last_name, phone, city').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            city: data.city || '',
          });
        }
      });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.first_name.trim() || !form.last_name.trim() || !form.phone.trim()) {
      toast.error('Completá nombre, apellido y celular.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim() || null,
    }).eq('id', user.id);
    setLoading(false);

    if (error) {
      toast.error('Error al guardar. Intentá de nuevo.');
      console.error(error);
      return;
    }
    toast.success('¡Perfil actualizado!');
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Completar perfil</h1>
          <p className="text-sm text-primary-foreground/70">Estos datos son necesarios para usar la app.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-4 -mt-2">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Tu nombre" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="pl-10 h-12 rounded-xl" required />
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">Apellido</Label>
                <Input placeholder="Tu apellido" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="h-12 rounded-xl" required />
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Celular</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="tel" placeholder="+54 11 1234-5678" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="pl-10 h-12 rounded-xl" required />
              </div>
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Ciudad (opcional)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Ej: Buenos Aires" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="pl-10 h-12 rounded-xl" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold text-sm gap-2">
              <Save className="h-4 w-4" /> {loading ? 'Guardando...' : 'Guardar perfil'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default EditProfile;
