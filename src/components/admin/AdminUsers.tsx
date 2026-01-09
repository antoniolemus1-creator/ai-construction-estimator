import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { EditUserModal } from './EditUserModal';
import { Pencil } from 'lucide-react';


export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any>(null);


  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User role updated');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const updateSubscriptionStatus = async (userId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ subscription_status: status })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Subscription status updated');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
    <Card>

      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-sm">{user.email}</TableCell>
                <TableCell>{user.full_name || 'N/A'}</TableCell>
                <TableCell>{user.company_name || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant={user.user_type === 'employee' ? 'default' : 'secondary'}>
                    {user.user_type || 'client'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select value={user.role} onValueChange={(val) => updateUserRole(user.id, val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.subscription_tier}</Badge>
                </TableCell>
                <TableCell>
                  <Select value={user.subscription_status} onValueChange={(val) => updateSubscriptionStatus(user.id, val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </CardContent>
    </Card>
    
    {editingUser && (
      <EditUserModal
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={loadUsers}
      />
    )}
    </>
  );
}

