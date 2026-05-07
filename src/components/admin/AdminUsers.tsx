import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Pencil, Trash2, Eye, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  email?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const openEdit = (u: UserRow) => {
    setEditing(u);
    setEditForm({
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone || '',
      city: u.city || '',
      verified: u.verified,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone || null,
      city: editForm.city || null,
      verified: editForm.verified,
    }).eq('id', editing.id);
    setSaving(false);
    if (error) { toast.error('Error al guardar.'); return; }
    toast.success('Usuario actualizado.');
    setEditing(null);
    loadUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario definitivamente? Se borrará su cuenta de acceso y todos sus datos. Esta acción no se puede deshacer.')) return;
    setDeleting(userId);
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: { action: 'delete_user', user_id: userId },
    });
    setDeleting(null);
    if (error || (data as any)?.error) {
      toast.error('Error al eliminar: ' + (error?.message || (data as any)?.error || ''));
      return;
    }
    toast.success('Usuario eliminado completamente.');
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('¿Enviar enlace de recuperación de contraseña al email del usuario?')) return;
    const redirect_to = `${window.location.origin}/reset-password`;
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: { action: 'send_recovery_by_id', user_id: userId, redirect_to },
    });
    if (error || (data as any)?.error) {
      toast.error('No se pudo enviar el enlace. ' + (error?.message || (data as any)?.error || ''));
      return;
    }
    toast.success('Se envió un enlace de recuperación al email del usuario.');
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
              <TableHead className="text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">Sin resultados</TableCell></TableRow>
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
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewUser(u)} title="Ver">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(u)} title="Editar">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary" onClick={() => handleResetPassword(u.id)} title="Restablecer contraseña">
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(u.id)} disabled={deleting === u.id} title="Eliminar definitivamente">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="text-[10px] text-muted-foreground text-right">{filtered.length} de {users.length} usuarios</p>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Detalle del usuario</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Nombre:</span> <span className="font-medium">{viewUser.first_name} {viewUser.last_name}</span></div>
              <div><span className="text-muted-foreground">Teléfono:</span> {viewUser.phone || '-'}</div>
              <div><span className="text-muted-foreground">Ciudad:</span> {viewUser.city || '-'}</div>
              <div><span className="text-muted-foreground">Verificado:</span> {viewUser.verified ? 'Sí' : 'No'}</div>
              <div><span className="text-muted-foreground">Viajes:</span> {viewUser.total_trips}</div>
              <div><span className="text-muted-foreground">Rating:</span> {viewUser.average_rating > 0 ? Number(viewUser.average_rating).toFixed(1) : '-'}</div>
              <div><span className="text-muted-foreground">Roles:</span> {viewUser.roles.map(r => r === 'passenger' ? 'Pasajero' : r === 'driver' ? 'Chofer' : 'Admin').join(', ')}</div>
              <div><span className="text-muted-foreground">Registro:</span> {new Date(viewUser.created_at).toLocaleDateString('es-AR')}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Nombre</Label>
              <Input value={editForm.first_name ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, first_name: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Apellido</Label>
              <Input value={editForm.last_name ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, last_name: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Teléfono</Label>
              <Input value={editForm.phone ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Ciudad</Label>
              <Input value={editForm.city ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Verificado</Label>
              <Switch checked={editForm.verified ?? false} onCheckedChange={v => setEditForm((f: any) => ({ ...f, verified: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving} className="gradient-accent text-primary-foreground">{saving ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
