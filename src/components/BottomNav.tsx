import { Home, Search, PlusCircle, User, LayoutDashboard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
