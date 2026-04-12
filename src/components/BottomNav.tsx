import { Home, Search, PlusCircle, User, LayoutDashboard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const passengerNav = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Search, label: 'Buscar', path: '/search' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

const driverNav = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: PlusCircle, label: 'Publicar', path: '/publish' },
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
      <div className="flex items-center justify-around py-1.5 px-2 max-w-lg mx-auto" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 min-w-[64px] py-2 px-3 rounded-xl transition-colors",
                isActive ? "text-primary" : "text-muted-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1.5 w-6 h-1 rounded-full gradient-accent"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className={cn("text-[10px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
