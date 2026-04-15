import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, Save, Camera, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getInitial } from '@/lib/avatarUtils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    avatar_url: '' as string | null,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('first_name, last_name, phone, city, avatar_url').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            city: data.city || '',
            avatar_url: data.avatar_url || null,
          });
        }
      });
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato no soportado. Usá JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('La imagen es muy pesada. Máximo 5 MB.');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error('Error al subir la foto.');
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const newUrl = `${publicData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', user.id);
    if (updateError) {
      toast.error('Error al guardar la foto.');
      console.error(updateError);
    } else {
      setForm(prev => ({ ...prev, avatar_url: newUrl }));
      toast.success('¡Foto actualizada!');
    }
    setUploading(false);
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setUploading(true);

    // Try to remove the file from storage (ignore errors if it doesn't exist)
    const { data: files } = await supabase.storage.from('avatars').list(user.id);
    if (files && files.length > 0) {
      await supabase.storage.from('avatars').remove(files.map(f => `${user.id}/${f.name}`));
    }

    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
    if (error) {
      toast.error('Error al eliminar la foto.');
    } else {
      setForm(prev => ({ ...prev, avatar_url: null }));
      toast.success('Foto eliminada.');
    }
    setUploading(false);
  };

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
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Editar perfil</h1>
          <p className="text-sm text-primary-foreground/70">Nombre, apellido, foto y ciudad.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-4 -mt-2">
        <div className="bg-card rounded-2xl p-5 border border-border">
          {/* Avatar section */}
          <div className="flex flex-col items-center mb-5">
            <Avatar className="h-20 w-20 mb-3">
              {form.avatar_url ? (
                <AvatarImage src={form.avatar_url} alt="Foto de perfil" />
              ) : null}
              <AvatarFallback className="text-2xl font-heading font-bold bg-primary/10 text-primary">
                {getInitial(form.first_name)}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 rounded-xl text-xs"
              >
                <Camera className="h-3.5 w-3.5" />
                {uploading ? 'Subiendo...' : form.avatar_url ? 'Cambiar foto' : 'Agregar foto'}
              </Button>
              {form.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={handleRemovePhoto}
                  className="gap-1.5 rounded-xl text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </Button>
              )}
            </div>
          </div>

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
