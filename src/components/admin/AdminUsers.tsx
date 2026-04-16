import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  city: string | null;
  verified: boolean;
  total_trips: number;
  average_rating: number;
  created_at: string;
  roles: string[];
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role'),
    ]);

    const roleMap: Record<string, string[]> = {};
    (roles ?? []).forEach(r => {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    });

    const mapped = (profiles ?? []).map(p => ({
      ...p,
      roles: roleMap[p.id] || ['passenger'],
    }));
    setUsers(mapped);
    setLoading(false);
  };

  const filtered = users.filter(u => {
    const matchesSearch = search === '' ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search) ||
      (u.city || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || u.roles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="text-center py-12"><p className="text-muted-foreground text-sm">Cargando usuarios...</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, teléfono o ciudad..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 text-xs h-9" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {['all', 'passenger', 'driver', 'admin'].map(r => (
          <Button key={r} variant={filterRole === r ? 'default' : 'outline'} size="sm" className="text-xs h-7"
            onClick={() => setFilterRole(r)}>
            {r === 'all' ? 'Todos' : r === 'passenger' ? 'Pasajeros' : r === 'driver' ? 'Choferes' : 'Admins'}
          </Button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Nombre</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-xs">Ciudad</TableHead>
              <TableHead className="text-xs">Viajes</TableHead>
              <TableHead className="text-xs">Rating</TableHead>
              <TableHead className="text-xs">Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">Sin resultados</TableCell></TableRow>
            ) : filtered.map(u => (
              <TableRow key={u.id}>
                <TableCell className="text-xs font-medium">
                  {u.first_name} {u.last_name}
                  {u.verified && <Badge variant="secondary" className="ml-1 text-[9px] px-1">✓</Badge>}
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex gap-1 flex-wrap">
                    {u.roles.map(r => (
                      <Badge key={r} variant={r === 'admin' ? 'destructive' : r === 'driver' ? 'default' : 'secondary'} className="text-[9px] px-1">
                        {r === 'passenger' ? 'Pasajero' : r === 'driver' ? 'Chofer' : 'Admin'}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.city || '-'}</TableCell>
                <TableCell className="text-xs">{u.total_trips}</TableCell>
                <TableCell className="text-xs">{u.average_rating > 0 ? `⭐ ${Number(u.average_rating).toFixed(1)}` : '-'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('es-AR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-[10px] text-muted-foreground text-right">{filtered.length} de {users.length} usuarios</p>
    </div>
  );
};

export default AdminUsers;
