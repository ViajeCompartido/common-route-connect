import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, BookOpen, MapPin, Trophy, TrendingUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BottomNav from '@/components/BottomNav';
import AdminStats from '@/components/admin/AdminStats';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminBookings from '@/components/admin/AdminBookings';
import AdminRoutes from '@/components/admin/AdminRoutes';
import AdminLeaderboard from '@/components/admin/AdminLeaderboard';
import AdminCharts from '@/components/admin/AdminCharts';

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      <div className="gradient-ocean px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-primary-foreground/70 mb-3 text-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <h1 className="text-lg font-heading font-bold text-primary-foreground">Dashboard Admin</h1>
          <p className="text-sm text-primary-foreground/70">Control total de la plataforma</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <Tabs defaultValue="stats">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="stats" className="text-[10px] flex-1 min-w-[60px] gap-1 px-2 py-1.5">
              <BarChart3 className="h-3 w-3" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="users" className="text-[10px] flex-1 min-w-[60px] gap-1 px-2 py-1.5">
              <Users className="h-3 w-3" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-[10px] flex-1 min-w-[60px] gap-1 px-2 py-1.5">
              <BookOpen className="h-3 w-3" /> Reservas
            </TabsTrigger>
            <TabsTrigger value="routes" className="text-[10px] flex-1 min-w-[60px] gap-1 px-2 py-1.5">
              <MapPin className="h-3 w-3" /> Rutas
            </TabsTrigger>
            <TabsTrigger value="ranking" className="text-[10px] flex-1 min-w-[60px] gap-1 px-2 py-1.5">
              <Trophy className="h-3 w-3" /> Ranking
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-[10px] flex-1 min-w-[60px] gap-1 px-2 py-1.5">
              <TrendingUp className="h-3 w-3" /> Gráficos
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="stats"><AdminStats /></TabsContent>
            <TabsContent value="users"><AdminUsers /></TabsContent>
            <TabsContent value="bookings"><AdminBookings /></TabsContent>
            <TabsContent value="routes"><AdminRoutes /></TabsContent>
            <TabsContent value="ranking"><AdminLeaderboard /></TabsContent>
            <TabsContent value="charts"><AdminCharts /></TabsContent>
          </div>
        </Tabs>
      </div>

      <BottomNav role="admin" />
    </div>
  );
};

export default AdminDashboard;
