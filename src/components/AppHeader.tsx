import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import weegoLogo from '@/assets/weego-logo.png';
import SideMenu from '@/components/SideMenu';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useNotifications } from '@/hooks/useNotifications';

const AppHeader = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalUnread } = useUnreadMessages();
  const { unreadCount } = useNotifications();
  const totalBadge = totalUnread + unreadCount;
  const hasUnread = totalBadge > 0;

  return (
    <>
      <SideMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <button
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 text-foreground active:opacity-70"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={weegoLogo} alt="WEEGO" className="h-14 w-14 object-contain drop-shadow-md" />
            <span className="font-heading font-bold text-2xl tracking-tight">
              WEE<span className="text-primary">GO</span>
            </span>
          </div>
          <button
            aria-label="Notificaciones"
            onClick={() => navigate('/notifications')}
            className="p-2 -mr-2 relative text-foreground active:opacity-70"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-card">
                {totalBadge > 99 ? '99+' : totalBadge}
              </span>
            )}
          </button>
        </div>
      </header>
    </>
  );
};

export default AppHeader;

