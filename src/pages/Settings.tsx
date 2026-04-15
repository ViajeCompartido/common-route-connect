import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Lock, Car, PawPrint, Bell, CreditCard, Wallet, LogOut, ChevronRight, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

interface SettingsItem {
  icon: any;
  label: string;
  desc: string;
  action: () => void;
  disabled?: boolean;
  badge?: string;
}

const Settings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, isDriver, loading } = useProfile();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const sections: { title: string; items: SettingsItem[] }[] = [
    {
      title: 'Cuenta',
      items: [
        { icon: User, label: 'Editar perfil', desc: 'Nombre, apellido, foto y ciudad', action: () => navigate('/edit-profile') },
        { icon: Phone, label: 'Cambiar celular', desc: 'Actualizá tu número de contacto', action: () => navigate('/edit-profile') },
        { icon: Lock, label: 'Cambiar contraseña', desc: 'Actualizá tu contraseña', action: () => navigate('/reset-password') },
      ],
    },
    {
      title: 'Chofer',
      items: [
        {
          icon: Car,
          label: isDriver ? 'Editar perfil de chofer' : 'Activar perfil de chofer',
          desc: isDriver ? 'Vehículo, patente, licencia' : 'Publicá viajes como chofer',
          action: () => navigate('/activate-driver'),
        },
        {
          icon: PawPrint,
          label: 'Preferencias de mascotas',
          desc: 'Tamaños aceptados y configuración',
          action: () => navigate('/activate-driver'),
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        { icon: Bell, label: 'Notificaciones', desc: 'Configuración de alertas', action: () => {}, disabled: true, badge: 'Próximamente' },
      ],
    },
    {
      title: 'Pagos',
      items: [
        {
          icon: CreditCard,
          label: 'Mercado Pago para pagar',
          desc: 'Vinculá tu cuenta para pagar viajes',
          action: () => navigate('/link-mercadopago?type=payer'),
        },
        ...(isDriver ? [{
          icon: Wallet,
          label: 'Mercado Pago para cobrar',
          desc: 'Vinculá tu cuenta para recibir cobros',
          action: () => navigate('/link-mercadopago?type=collector'),
        } as SettingsItem] : []),
      ],
    },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando...</p></div>;
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm active:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Configuración</h1>
          <p className="text-sm text-primary-foreground/70">Gestioná tu cuenta y preferencias.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {sections.map((section, si) => (
          <motion.div key={section.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <h3 className="text-[10px] font-heading font-bold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">{section.title}</h3>
              <div className="divide-y divide-border">
                {section.items.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    disabled={item.disabled}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
                    </div>
                    {item.badge ? (
                      <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Construction className="h-3 w-3" /> {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button
            variant="outline"
            className="w-full h-12 gap-2 rounded-xl text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </Button>
        </motion.div>
      </div>

      <BottomNav role={isDriver ? 'driver' : 'passenger'} />
    </div>
  );
};

export default Settings;
