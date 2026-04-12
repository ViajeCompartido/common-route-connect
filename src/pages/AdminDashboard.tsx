import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Car, DollarSign, TrendingUp, MapPin, PawPrint, Star, XCircle, BarChart3, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const monthlyData = [
  { month: 'Ene', viajes: 45, ingresos: 112500 },
  { month: 'Feb', viajes: 52, ingresos: 130000 },
  { month: 'Mar', viajes: 68, ingresos: 170000 },
  { month: 'Abr', viajes: 41, ingresos: 102500 },
];

const routeData = [
  { name: 'CABA → La Plata', value: 38 },
  { name: 'Córdoba → Rosario', value: 22 },
  { name: 'CABA → Mar del Plata', value: 18 },
  { name: 'Mendoza → San Juan', value: 12 },
  { name: 'Otras', value: 10 },
];

const PIE_COLORS = ['hsl(200, 55%, 40%)', 'hsl(174, 55%, 46%)', 'hsl(190, 50%, 38%)', 'hsl(205, 50%, 30%)', 'hsl(210, 20%, 70%)'];

const stats = [
  { label: 'Viajes publicados', value: '312', icon: Car, color: 'text-primary' },
  { label: 'Viajes realizados', value: '206', icon: Car, color: 'text-accent' },
  { label: 'Pasajeros transportados', value: '512', icon: Users, color: 'text-ocean-light' },
  { label: 'Usuarios registrados', value: '1.248', icon: UserCheck, color: 'text-primary' },
  { label: 'Ingresos brutos', value: '$1.540.000', icon: DollarSign, color: 'text-accent' },
  { label: 'Comisiones plataforma', value: '$154.000', icon: TrendingUp, color: 'text-ocean-light' },
  { label: 'Pagos pendientes', value: '$42.500', icon: DollarSign, color: 'text-amber-600' },
  { label: 'Tasa cancelación', value: '4.2%', icon: XCircle, color: 'text-destructive' },
];

const topDrivers = [
  { name: 'Lucía Torres', trips: 112, rating: 5.0 },
  { name: 'María López', trips: 78, rating: 4.9 },
  { name: 'Carlos Méndez', trips: 45, rating: 4.8 },
];

const topPassengers = [
  { name: 'Camila Herrera', trips: 31, rating: 4.9 },
  { name: 'Ana García', trips: 12, rating: 4.7 },
  { name: 'Lucas Pérez', trips: 8, rating: 4.5 },
];

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
          <p className="text-sm text-primary-foreground/70">Resumen completo de la plataforma</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Key stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className="text-lg font-heading font-bold">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trips chart */}
        <Card className="p-4">
          <h3 className="text-sm font-heading font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Viajes por mes
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="viajes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue chart */}
        <Card className="p-4">
          <h3 className="text-sm font-heading font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-accent" /> Ingresos por mes
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Bar dataKey="ingresos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Routes pie chart */}
        <Card className="p-4">
          <h3 className="text-sm font-heading font-semibold mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Rutas más usadas
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={routeData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={60}>
                  {routeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 flex-1">
              {routeData.map((r, i) => (
                <div key={r.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="flex-1 text-muted-foreground">{r.name}</span>
                  <span className="font-bold">{r.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top drivers & passengers */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <h3 className="text-xs font-heading font-semibold mb-3 flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-primary" /> Top choferes
            </h3>
            <div className="space-y-2">
              {topDrivers.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{d.name}</p>
                    <p className="text-[9px] text-muted-foreground">{d.trips} viajes · ★{d.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-xs font-heading font-semibold mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-accent" /> Top pasajeros
            </h3>
            <div className="space-y-2">
              {topPassengers.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{p.name}</p>
                    <p className="text-[9px] text-muted-foreground">{p.trips} viajes · ★{p.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Additional metrics */}
        <Card className="p-4">
          <h3 className="text-xs font-heading font-semibold mb-3 flex items-center gap-1.5">
            <PawPrint className="h-3.5 w-3.5 text-accent" /> Métricas adicionales
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/60 rounded-xl p-3 text-center">
              <p className="text-lg font-heading font-bold">23</p>
              <p className="text-[10px] text-muted-foreground">Viajes con mascotas</p>
            </div>
            <div className="bg-secondary/60 rounded-xl p-3 text-center">
              <p className="text-lg font-heading font-bold">4.7★</p>
              <p className="text-[10px] text-muted-foreground">Rating promedio</p>
            </div>
            <div className="bg-secondary/60 rounded-xl p-3 text-center">
              <p className="text-lg font-heading font-bold">$385.000</p>
              <p className="text-[10px] text-muted-foreground">Ingresos netos</p>
            </div>
            <div className="bg-secondary/60 rounded-xl p-3 text-center">
              <p className="text-lg font-heading font-bold">18</p>
              <p className="text-[10px] text-muted-foreground">Choferes activos</p>
            </div>
          </div>
        </Card>
      </div>

      <BottomNav role="admin" />
    </div>
  );
};

export default AdminDashboard;
