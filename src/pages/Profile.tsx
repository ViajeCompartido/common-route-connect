import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Settings, LogOut, BadgeCheck, Car, Shield, Clock, XCircle, PawPrint, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { mockUser, mockDriverUser, mockReviews } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const [viewAs, setViewAs] = useState<'passenger' | 'driver'>('passenger');
  const user = viewAs === 'driver' ? mockDriverUser : mockUser;

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-16">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          {/* Role toggle for demo */}
          <div className="flex gap-2 mt-1">
            <button onClick={() => setViewAs('passenger')} className={`text-[10px] px-3 py-1 rounded-full transition-all ${viewAs === 'passenger' ? 'bg-accent text-accent-foreground' : 'bg-primary-foreground/10 text-primary-foreground/70'}`}>
              Ver como pasajero
            </button>
            <button onClick={() => setViewAs('driver')} className={`text-[10px] px-3 py-1 rounded-full transition-all ${viewAs === 'driver' ? 'bg-accent text-accent-foreground' : 'bg-primary-foreground/10 text-primary-foreground/70'}`}>
              Ver como chofer
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-12 space-y-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={viewAs}>
          <div className="bg-card rounded-2xl p-5 border border-border text-center">
            <div className="w-20 h-20 rounded-full gradient-ocean mx-auto flex items-center justify-center text-primary-foreground text-2xl font-heading font-bold -mt-14 border-4 border-card shadow-ocean">
              {user.name.charAt(0)}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <h2 className="text-lg font-heading font-bold">{user.name}</h2>
              {user.verified && <BadgeCheck className="h-5 w-5 text-accent" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {user.role === 'passenger' ? 'Pasajero/a' : 'Chofer'}
              {user.city && ` · ${user.city}`}
            </p>
            {user.verified && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <Shield className="h-3 w-3 text-accent" />
                <span className="text-[10px] text-accent font-medium">Perfil verificado</span>
              </div>
            )}

            {/* Badges */}
            {user.badges && user.badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {user.badges.map(b => (
                  <Badge key={b.type} variant="secondary" className="text-[10px] gap-1 rounded-full px-2.5 py-1">
                    {b.icon} {b.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mt-4 py-4 border-t border-border">
              <div className="text-center">
                <StarRating rating={user.rating} size="sm" />
                <p className="text-lg font-heading font-bold mt-0.5">{user.rating}</p>
                <p className="text-[9px] text-muted-foreground">{user.totalRatings} calif.</p>
              </div>
              <div className="text-center">
                <Car className="h-4 w-4 text-primary mx-auto" />
                <p className="text-lg font-heading font-bold mt-0.5">{user.totalTrips}</p>
                <p className="text-[9px] text-muted-foreground">viajes</p>
              </div>
              <div className="text-center">
                <Clock className="h-4 w-4 text-accent mx-auto" />
                <p className="text-lg font-heading font-bold mt-0.5">{user.punctuality}%</p>
                <p className="text-[9px] text-muted-foreground">puntualidad</p>
              </div>
              <div className="text-center">
                <XCircle className="h-4 w-4 text-destructive mx-auto" />
                <p className="text-lg font-heading font-bold mt-0.5">{user.cancellationRate}%</p>
                <p className="text-[9px] text-muted-foreground">cancelaciones</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Driver-specific info */}
        {viewAs === 'driver' && user.vehicle && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <div className="bg-card rounded-2xl p-4 border border-border">
              <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">Vehículo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Car className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{user.vehicle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground ml-7">Patente: <span className="font-medium text-foreground">{user.plate}</span></span>
                </div>
                {user.acceptsPets && (
                  <div className="flex items-center gap-3">
                    <PawPrint className="h-4 w-4 text-accent shrink-0" />
                    <span className="text-xs">Acepta mascotas</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Personal info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider">Datos personales</h3>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Miembro desde {user.createdAt}</span>
            </div>
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wider mb-3">Qué dicen de vos</h3>
            <div className="space-y-2">
              {mockReviews.map(r => (
                <div key={r.id} className="bg-secondary/60 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full gradient-ocean flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                      {r.fromUserName.charAt(0)}
                    </div>
                    <span className="text-xs font-medium flex-1">{r.fromUserName}</span>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground pl-8">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="space-y-2 pt-1">
          <Button variant="outline" className="w-full h-12 gap-2 rounded-xl">
            <Settings className="h-4 w-4" /> Configuración
          </Button>
          <Button variant="outline" className="w-full h-12 gap-2 rounded-xl text-destructive hover:text-destructive" onClick={() => navigate('/login')}>
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </div>
      </div>

      <BottomNav role={viewAs} />
    </div>
  );
};

export default Profile;
