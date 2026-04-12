import { Home, Search, PlusCircle, User, LayoutDashboard, ClipboardList, Hand, Users, Bell } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const passengerNav = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Search, label: 'Buscar', path: '/search' },
  { icon: Hand, label: 'Necesito', path: '/need-ride' },
  { icon: ClipboardList, label: 'Mis viajes', path: '/my-trips' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

const driverNav = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: PlusCircle, label: 'Publicar', path: '/publish' },
  { icon: Users, label: 'Pasajeros', path: '/compatible-passengers' },
  { icon: Bell, label: 'Solicitudes', path: '/driver-requests' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

const adminNav = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

interface BottomNavProps {
  role?: 'passenger' | 'driver' | 'admin';
}

const BottomNav = ({ role = 'passenger' }: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = role === 'admin' ? adminNav : role === 'driver' ? driverNav : passengerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around py-1 px-1 max-w-lg mx-auto" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 min-w-[52px] py-1.5 px-2 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 w-5 h-0.5 rounded-full gradient-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn("text-[9px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
