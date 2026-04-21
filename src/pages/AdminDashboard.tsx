import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, MapPin, BarChart3, ShieldAlert, Users, XCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import AdminFinance from '@/components/admin/AdminFinance';
import AdminRoutes from '@/components/admin/AdminRoutes';
import AdminStats from '@/components/admin/AdminStats';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminCancellations from '@/components/admin/AdminCancellations';
import { useProfile } from '@/hooks/useProfile';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useProfile();

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/', { replace: true });
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground text-sm">Cargando...</p></div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive mb-3" />
        <p className="text-sm">No tenés permisos para ver este panel.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Panel admin</h1>
          <p className="text-sm text-primary-foreground/70">Lo que importa, en un vistazo.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Tabs defaultValue="finance">
          <TabsList className="w-full grid grid-cols-5 h-auto bg-muted/50 p-1">
            <TabsTrigger value="finance" className="text-[10px] gap-1 px-1 py-2 flex-col">
              <DollarSign className="h-3.5 w-3.5" /> Finanzas
            </TabsTrigger>
            <TabsTrigger value="routes" className="text-[10px] gap-1 px-1 py-2 flex-col">
              <MapPin className="h-3.5 w-3.5" /> Rutas
            </TabsTrigger>
            <TabsTrigger value="users" className="text-[10px] gap-1 px-1 py-2 flex-col">
              <Users className="h-3.5 w-3.5" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="cancels" className="text-[10px] gap-1 px-1 py-2 flex-col">
              <XCircle className="h-3.5 w-3.5" /> Cancelac.
            </TabsTrigger>
            <TabsTrigger value="metrics" className="text-[10px] gap-1 px-1 py-2 flex-col">
              <BarChart3 className="h-3.5 w-3.5" /> Métricas
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="finance"><AdminFinance /></TabsContent>
            <TabsContent value="routes"><AdminRoutes /></TabsContent>
            <TabsContent value="users"><AdminUsers /></TabsContent>
            <TabsContent value="cancels"><AdminCancellations /></TabsContent>
            <TabsContent value="metrics"><AdminStats /></TabsContent>
          </div>
        </Tabs>
      </div>

      <BottomNav role="admin" />
    </div>
  );
};

export default AdminDashboard;
