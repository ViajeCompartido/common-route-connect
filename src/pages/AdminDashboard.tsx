import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Car, DollarSign, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { month: 'Ene', viajes: 45, ingresos: 112500 },
  { month: 'Feb', viajes: 52, ingresos: 130000 },
  { month: 'Mar', viajes: 68, ingresos: 170000 },
  { month: 'Abr', viajes: 41, ingresos: 102500 },
];

const stats = [
  { label: 'Viajes realizados', value: '206', icon: Car, color: 'text-primary' },
  { label: 'Pasajeros totales', value: '512', icon: Users, color: 'text-accent' },
  { label: 'Ingresos plataforma', value: '$515.000', icon: DollarSign, color: 'text-ocean-light' },
  { label: 'Crecimiento mensual', value: '+12%', icon: TrendingUp, color: 'text-accent' },
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
          <p className="text-sm text-primary-foreground/70">Resumen de la plataforma</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className="text-xl font-heading font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="p-4">
          <h3 className="text-sm font-heading font-semibold mb-4">Viajes por mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="viajes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4 mt-3">
          <h3 className="text-sm font-heading font-semibold mb-4">Ingresos por mes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Bar dataKey="ingresos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <BottomNav role="admin" />
    </div>
  );
};

export default AdminDashboard;
