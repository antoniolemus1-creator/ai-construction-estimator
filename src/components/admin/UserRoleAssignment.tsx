import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  roles?: { id: string; name: string }[];
}

interface Role {
  id: string;
  name: string;
}

export function UserRoleAssignment() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        supabase.from('user_profiles').select('id, email'),
        supabase.from('roles').select('id, name')
      ]);

      if (usersRes.data) {
        const usersWithRoles = await Promise.all(
          usersRes.data.map(async (user) => {
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select('role_id, roles(id, name)')
              .eq('user_id', user.id);
            return { ...user, roles: userRoles?.map(ur => ur.roles).filter(Boolean) || [] };
          })
        );
        setUsers(usersWithRoles as User[]);
      }

      if (rolesRes.data) setRoles(rolesRes.data);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser, role_id: selectedRole });

      if (error) throw error;

      toast.success('Role assigned successfully');
      setSelectedUser('');
      setSelectedRole('');
      loadData();
    } catch (error: any) {
      toast.error('Failed to assign role');
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;

      toast.success('Role removed successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to remove role');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Assign Role to User</h3>
        <div className="flex gap-4">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select User" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAssignRole} disabled={!selectedUser || !selectedRole}>
            <UserPlus className="w-4 h-4 mr-2" />
            Assign
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">User Role Assignments</h3>
        {users.map(user => (
          <Card key={user.id} className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{user.email}</span>
              <div className="flex gap-2">
                {user.roles?.map(role => (
                  <Badge key={role.id} variant="secondary" className="flex items-center gap-2">
                    {role.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => handleRemoveRole(user.id, role.id)}
                    />
                  </Badge>
                ))}
                {!user.roles?.length && <span className="text-sm text-gray-500">No roles assigned</span>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
