import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StarRating from '@/components/StarRating';
import BottomNav from '@/components/BottomNav';
import { mockUser, mockReviews } from '@/data/mockData';
import { motion } from 'framer-motion';

const Profile = () => {
  const navigate = useNavigate();
  const user = mockUser;

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-12">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-5 text-center">
            <div className="w-20 h-20 rounded-full gradient-ocean mx-auto flex items-center justify-center text-primary-foreground text-2xl font-heading font-bold -mt-14 border-4 border-card">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-lg font-heading font-bold mt-3">{user.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user.role === 'passenger' ? 'Pasajero' : user.role === 'driver' ? 'Chofer' : 'Administrador'}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <StarRating rating={user.rating} size="sm" />
              <span className="text-sm text-muted-foreground">{user.rating} ({user.totalRatings} viajes)</span>
            </div>
          </Card>

          <Card className="p-4 mt-3 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Miembro desde {user.createdAt}</span>
            </div>
          </Card>

          <Card className="p-4 mt-3">
            <h3 className="text-sm font-heading font-semibold mb-3">Últimas reseñas</h3>
            <div className="space-y-3">
              {mockReviews.map(r => (
                <div key={r.id} className="bg-secondary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">{r.fromUserName}</span>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{r.comment}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full gap-2">
              <Settings className="h-4 w-4" /> Configuración
            </Button>
            <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive" onClick={() => navigate('/login')}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </Button>
          </div>
        </motion.div>
      </div>

      <BottomNav role="passenger" />
    </div>
  );
};

export default Profile;
