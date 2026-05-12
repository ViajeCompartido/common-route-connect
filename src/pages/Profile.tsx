import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Settings, LogOut, BadgeCheck, Car, Shield, Clock, XCircle, PawPrint, Edit, Plus, ShieldCheck } from 'lucide-react';
import { getInitial } from '@/lib/avatarUtils';
import { Button } from '@/components/ui/button';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, ProfileData, DriverProfileData } from '@/hooks/useProfile';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReviewData {
  id: string;
  from_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  fromName: string;
}

const PET_SIZE_LABELS: Record<string, string> = {
  small: 'Chica',
  medium: 'Mediana',
  large: 'Grande',
};

// Display-side fixes for common Argentine city names missing accents
const CITY_FIXES: Record<string, string> = {
  'bahia blanca': 'Bahía Blanca',
  'cordoba': 'Córdoba',
  'rio cuarto': 'Río Cuarto',
  'concepcion del uruguay': 'Concepción del Uruguay',
};
const formatCity = (city?: string | null) => {
  if (!city) return '';
  const key = city.trim().toLowerCase();
  return CITY_FIXES[key] ?? city;
};

const Profile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const { user, signOut } = useAuth();
  const own = useProfile();

  const isOwnProfile = !userId || userId === user?.id;

  // Public-view state (when looking at someone else)
  const [otherProfile, setOtherProfile] = useState<ProfileData | null>(null);
  const [otherDriver, setOtherDriver] = useState<DriverProfileData | null>(null);
  const [otherIsDriver, setOtherIsDriver] = useState(false);
  const [loadingOther, setLoadingOther] = useState(false);

  useEffect(() => {
    if (isOwnProfile) return;
    setLoadingOther(true);
    (async () => {
      const [{ data: p }, { data: d }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId!).single(),
        supabase.from('driver_profiles').select('vehicle, plate, color, max_seats, accepts_pets, pet_sizes_accepted, license_url, license_verified').eq('user_id', userId!).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId!),
      ]);
      if (p) setOtherProfile(p as ProfileData);
      if (d) setOtherDriver(d as DriverProfileData);
      setOtherIsDriver(((roles ?? []).map(r => r.role)).includes('driver'));
      setLoadingOther(false);
    })();
  }, [userId, isOwnProfile]);

  const profile = isOwnProfile ? own.profile : otherProfile;
  const driverProfile = isOwnProfile ? own.driverProfile : otherDriver;
  const isDriver = isOwnProfile ? own.isDriver : otherIsDriver;
  const isAdmin = isOwnProfile ? own.isAdmin : false;
  const loading = isOwnProfile ? own.loading : loadingOther;

  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const targetUserId = isOwnProfile ? user?.id : userId;

  useEffect(() => {
    if (!targetUserId) return;
    supabase.from('reviews').select('id, from_user_id, rating, comment, created_at')
      .eq('to_user_id', targetUserId).order('created_at', { ascending: false }).limit(10)
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setReviews([]); return; }
        const enriched: ReviewData[] = [];
        for (const r of data) {
          const { data: p } = await supabase.from('profiles').select('first_name, last_name').eq('id', r.from_user_id).single();
          enriched.push({ ...r, fromName: p ? `${p.first_name} ${p.last_name}`.trim() || 'Usuario' : 'Usuario' });
        }
        setReviews(enriched);
      });
  }, [targetUserId]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando perfil...</p></div>;
  }

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : '';
  const isProfileComplete = profile ? !!(profile.first_name && profile.last_name && profile.phone) : false;

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-16">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-12 space-y-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl p-5 border border-border text-center">
            <div className="w-32 h-32 rounded-full gradient-ocean mx-auto flex items-center justify-center text-primary-foreground text-4xl font-heading font-bold -mt-20 border-4 border-card ring-2 ring-accent shadow-ocean overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover rounded-full" />
              ) : (
                getInitial(profile?.first_name)
              )}
            </div>

            {isOwnProfile && !isProfileComplete ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">Tu perfil está incompleto.</p>
                <Button onClick={() => navigate('/edit-profile')} className="gradient-accent text-primary-foreground rounded-xl gap-2">
                  <Edit className="h-4 w-4" /> Completá tu perfil
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <h2 className="text-lg font-heading font-bold">{fullName}</h2>
                  {profile?.verified && <BadgeCheck className="h-5 w-5 text-accent" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isDriver ? 'Chofer' : 'Pasajero/a'}
                  {profile?.city && ` · ${formatCity(profile.city)}`}
                </p>
                {profile?.verified && (
                  <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30">
                    <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[11px] text-accent font-semibold">Perfil verificado</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 mt-4 py-4 border-t border-border">
                  <div className="text-center">
                    <StarRating rating={profile?.average_rating ?? 0} size="sm" />
                    <p className="text-lg font-heading font-bold mt-0.5">{profile?.average_rating ?? 0}</p>
                    <p className="text-[9px] text-muted-foreground">{profile?.total_ratings ?? 0} calif.</p>
                  </div>
                  <div className="text-center">
                    <Car className="h-4 w-4 text-primary mx-auto" />
                    <p className="text-lg font-heading font-bold mt-0.5">{profile?.total_trips ?? 0}</p>
                    <p className="text-[9px] text-muted-foreground">viajes</p>
                  </div>
                  <div className="text-center">
                    <Clock className="h-4 w-4 text-accent mx-auto" />
                    <p className="text-lg font-heading font-bold mt-0.5">{profile?.punctuality ?? 100}%</p>
                    <p className="text-[9px] text-muted-foreground">puntualidad</p>
                  </div>
                  <div className="text-center">
                    <XCircle className="h-4 w-4 text-destructive mx-auto" />
                    <p className="text-lg font-heading font-bold mt-0.5">{profile?.cancellation_rate ?? 0}%</p>
                    <p className="text-[9px] text-muted-foreground">cancelaciones</p>
                  </div>
                </div>

                {isOwnProfile && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/edit-profile')} className="mt-2 text-xs text-primary gap-1">
                    <Edit className="h-3 w-3" /> Editar perfil
                  </Button>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Driver section */}
        {isDriver && driverProfile ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">Vehículo</h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{driverProfile.vehicle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {driverProfile.color ? `Color ${driverProfile.color.toLowerCase()} · ` : ''}Patente {driverProfile.plate}
                  </p>
                  {driverProfile.accepts_pets && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <PawPrint className="h-3.5 w-3.5 text-accent" />
                      <span className="text-[11px] text-muted-foreground">
                        Acepta mascotas
                        {driverProfile.pet_sizes_accepted?.length > 0 && (
                          <> ({driverProfile.pet_sizes_accepted.map(s => PET_SIZE_LABELS[s] || s).join(', ')})</>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : isOwnProfile && !isDriver ? (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <div className="bg-card rounded-2xl p-4 border border-border text-center space-y-3">
              <Car className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">¿Querés publicar viajes como chofer?</p>
              <Button onClick={() => navigate('/activate-driver')} className="gradient-accent text-primary-foreground rounded-xl gap-2">
                <Plus className="h-4 w-4" /> Activar perfil de chofer
              </Button>
            </div>
          </motion.div>
        ) : null}

        {/* Account info — only own profile (privacy) */}
        {isOwnProfile && isProfileComplete && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider">Información de cuenta</h3>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Miembro desde {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) : '-'}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {isOwnProfile ? 'Qué dicen de vos' : 'Qué dicen sus pasajeros'}
              </h3>
              <div className="space-y-2">
                {reviews.map(r => (
                  <div key={r.id} className="bg-secondary/60 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                        {getInitial(r.fromName)}
                      </div>
                      <span className="text-xs font-medium flex-1">{r.fromName}</span>
                      <StarRating rating={r.rating} size="sm" />
                    </div>
                    {r.comment && <p className="text-xs text-muted-foreground pl-8">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions — own profile only */}
        {isOwnProfile && (
          <div className="space-y-2 pt-1">
            {isAdmin && (
              <Button variant="outline" className="w-full h-12 gap-2 rounded-xl border-accent/40 text-accent hover:text-accent" onClick={() => navigate('/admin')}>
                <ShieldCheck className="h-4 w-4" /> Panel admin
              </Button>
            )}
            <Button variant="outline" className="w-full h-12 gap-2 rounded-xl" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4" /> Configuración
            </Button>
            <Button variant="outline" className="w-full h-12 gap-2 rounded-xl text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </Button>
          </div>
        )}
      </div>

      <BottomNav role={isDriver ? 'driver' : 'passenger'} />
    </div>
  );
};

export default Profile;
