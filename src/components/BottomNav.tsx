import { Home, Search, PlusCircle, User, ClipboardList } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useProfile } from '@/hooks/useProfile';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Search, label: 'Buscar', path: '/search' },
  { icon: PlusCircle, label: 'Publicar', path: '/publish-hub' },
  { icon: ClipboardList, label: 'Mis viajes', path: '/my-trips' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

interface BottomNavProps {
  role?: 'passenger' | 'driver' | 'admin';
}

const BottomNav = (_: BottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalUnread } = useUnreadMessages();
  const { isDriver } = useProfile();

  const chatHostPath = '/my-trips';

  const handleNav = (path: string) => {
    if (path === '/publish-hub') {
      navigate(isDriver ? '/publish' : '/need-ride');
      return;
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around py-1 px-1 max-w-lg mx-auto" style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
            || (item.path === '/publish-hub' && (location.pathname === '/publish' || location.pathname === '/need-ride'))
            || (item.path === '/my-trips' && (location.pathname === '/driver-requests' || location.pathname === '/compatible-passengers'));
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
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
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                {item.path === chatHostPath && totalUnread > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </div>
              <span className={cn("text-[9px]", isActive ? "font-bold" : "font-medium")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
