import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useNavigate } from 'react-router-dom';
import {
  User, Car, Search, ClipboardList, Settings, HelpCircle,
  FileText, ShieldCheck, LogOut, MessageCircle, CreditCard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import weegoLogo from '@/assets/weego-logo.png';

interface SideMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SideMenu = ({ open, onOpenChange }: SideMenuProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { profile, isAdmin, isDriver } = useProfile();

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    navigate('/welcome');
  };

  const items = [
    { icon: User, label: 'Mi perfil', path: '/profile' },
    { icon: Search, label: 'Buscar viaje', path: '/search' },
    { icon: Car, label: isDriver ? 'Publicar viaje' : 'Activar como chofer', path: isDriver ? '/publish' : '/activate-driver' },
    { icon: ClipboardList, label: 'Mis viajes', path: '/my-trips' },
    { icon: MessageCircle, label: 'Mensajes', path: '/my-trips' },
    { icon: CreditCard, label: 'Mercado Pago', path: '/link-mercadopago' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
    { icon: HelpCircle, label: 'Ayuda', path: '/help' },
    { icon: FileText, label: 'Términos y privacidad', path: '/terms' },
  ];

  const initials = profile
    ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase() || 'U'
    : 'U';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85%] max-w-sm p-0 flex flex-col">
        <SheetHeader className="sr-only">
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>

        {/* Header with profile */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-5 pt-8">
          <div className="flex items-center gap-2 mb-5">
            <img src={weegoLogo} alt="WEEGO" className="h-7 w-7 object-contain bg-card rounded-full p-1" />
            <span className="font-heading font-bold text-lg tracking-tight">
              WEEGO
            </span>
          </div>
          <button
            onClick={() => go('/profile')}
            className="flex items-center gap-3 w-full text-left active:opacity-80"
          >
            <div className="h-12 w-12 rounded-full bg-card text-primary flex items-center justify-center font-heading font-bold text-lg">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading font-bold truncate">
                {profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Tu cuenta'}
              </p>
              <p className="text-xs text-primary-foreground/80 truncate">{user?.email ?? 'Ver perfil'}</p>
            </div>
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => go(it.path)}
              className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <it.icon className="h-5 w-5 text-muted-foreground" />
              <span>{it.label}</span>
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => go('/admin')}
              className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-primary hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>Panel admin</span>
            </button>
          )}
        </nav>

        {/* Sign out */}
        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 active:bg-destructive/20 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideMenu;
