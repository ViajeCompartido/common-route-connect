import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, CreditCard, Users, Camera, Shield, CheckCircle2, Info, PawPrint } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const PET_SIZES = [
  { value: 'small', label: 'Chica' },
  { value: 'medium', label: 'Mediana' },
  { value: 'large', label: 'Grande' },
];

const ActivateDriver = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    vehicle: '',
    plate: '',
    maxSeats: '4',
    acceptsPets: false,
    petSizesAccepted: [] as string[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLicenseFile(file);
      toast.success('Foto de licencia cargada');
    }
  };

  const togglePetSize = (size: string) => {
    setForm(f => ({
      ...f,
      petSizesAccepted: f.petSizesAccepted.includes(size)
        ? f.petSizesAccepted.filter(s => s !== size)
        : [...f.petSizesAccepted, size],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseFile) {
      toast.error('Necesitás subir tu licencia de conducir.');
      return;
    }
    if (!user) {
      toast.error('Tenés que iniciar sesión primero.');
      return;
    }
    if (form.acceptsPets && form.petSizesAccepted.length === 0) {
      toast.error('Seleccioná qué tamaños de mascota aceptás.');
      return;
    }

    setIsLoading(true);

    const fileExt = licenseFile.name.split('.').pop();
    const filePath = `${user.id}/license.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('licenses')
      .upload(filePath, licenseFile, { upsert: true });

    if (uploadError) {
      setIsLoading(false);
      toast.error('Error al subir la licencia. Intentá de nuevo.');
      console.error(uploadError);
      return;
    }

    const { error: driverError } = await supabase.from('driver_profiles').insert({
      user_id: user.id,
      vehicle: form.vehicle,
      plate: form.plate.toUpperCase(),
      max_seats: parseInt(form.maxSeats),
      accepts_pets: form.acceptsPets,
      pet_sizes_accepted: form.petSizesAccepted,
      license_url: filePath,
    });

    if (driverError) {
      setIsLoading(false);
      if (driverError.code === '23505') {
        toast.error('Ya tenés un perfil de chofer activado.');
      } else {
        toast.error('Error al activar el perfil. Intentá de nuevo.');
        console.error(driverError);
      }
      return;
    }

    const { error: roleError } = await supabase.rpc('add_driver_role');
    setIsLoading(false);

    if (roleError) {
      toast.error('Perfil creado pero hubo un error al asignar el rol.');
      console.error(roleError);
    } else {
      toast.success('¡Perfil de chofer activado! Ya podés publicar viajes.');
      navigate('/publish');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Car className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-heading font-bold text-primary-foreground">Activar perfil de chofer</h1>
          </div>
          <p className="text-sm text-primary-foreground/70">Completá estos datos para poder publicar viajes.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto px-4 -mt-2">
        <div className="bg-accent/10 rounded-2xl p-4 flex items-start gap-2.5 mb-4">
          <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Tu cuenta sigue siendo la misma. Al activar el perfil de chofer podés publicar viajes y también seguir buscando viajes como pasajero.
          </p>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border">
          <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-4">Datos del vehículo</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Vehículo (ej: VW Gol Trend 2018)" value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>

            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Patente (ej: AB 123 CD)" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} className="pl-10 h-12 rounded-xl" required />
            </div>

            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">Asientos máximos del vehículo</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="number" min="1" max="8" value={form.maxSeats} onChange={e => setForm({ ...form, maxSeats: e.target.value })} className="pl-10 h-12 rounded-xl" required />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">En cada viaje vas a poder elegir cuántos lugares ofrecer.</p>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider">Mascotas</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="acceptsPets" className="flex items-center gap-2 text-sm">
                  <PawPrint className="h-4 w-4 text-accent" /> Acepto mascotas
                </Label>
                <Switch id="acceptsPets" checked={form.acceptsPets} onCheckedChange={v => setForm({ ...form, acceptsPets: v, petSizesAccepted: v ? form.petSizesAccepted : [] })} />
              </div>

              {form.acceptsPets && (
                <div className="ml-6 space-y-2">
                  <Label className="text-[10px] text-muted-foreground block">¿Qué tamaños aceptás?</Label>
                  <div className="flex gap-3">
                    {PET_SIZES.map(s => (
                      <label key={s.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Checkbox checked={form.petSizesAccepted.includes(s.value)} onCheckedChange={() => togglePetSize(s.value)} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">Licencia de conducir</h3>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Subí una foto de tu licencia vigente. Es un requisito para poder publicar viajes.
              </p>

              {licenseFile ? (
                <div className="flex items-center gap-2 bg-accent/10 rounded-xl p-3">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-accent">Licencia cargada</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer active:bg-muted/50 transition-colors">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-foreground">Subir foto de licencia</span>
                  <span className="text-[10px] text-muted-foreground mt-1">Tocá para seleccionar una imagen</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 bg-secondary/60 rounded-xl p-3">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <p className="text-[10px] text-muted-foreground">Tu información se verifica para garantizar la seguridad de todos.</p>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 gradient-accent text-primary-foreground rounded-xl font-semibold text-sm gap-2">
              <Car className="h-4 w-4" /> {isLoading ? 'Activando...' : 'Activar perfil de chofer'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ActivateDriver;
