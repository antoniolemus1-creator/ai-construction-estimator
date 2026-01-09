import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { CreateRoleModal } from './CreateRoleModal';
import { EditRoleModal } from './EditRoleModal';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description: string;
  is_system_role: boolean;
  permission_count?: number;
}

export function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions(count)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRoles(data || []);
    } catch (error: any) {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const { error } = await supabase.from('roles').delete().eq('id', roleId);
      if (error) throw error;
      toast.success('Role deleted successfully');
      loadRoles();
    } catch (error: any) {
      toast.error('Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Roles Management</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">{role.name}</h3>
                  {role.is_system_role && (
                    <Badge variant="secondary">System Role</Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{role.description}</p>
                <p className="text-sm text-gray-500">
                  {role.permission_count || 0} permissions assigned
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRole(role)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                {!role.is_system_role && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(role.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadRoles}
        />
      )}

      {editingRole && (
        <EditRoleModal
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSuccess={loadRoles}
        />
      )}
    </div>
  );
}
