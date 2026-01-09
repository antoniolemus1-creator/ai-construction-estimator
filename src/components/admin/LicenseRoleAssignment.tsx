import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  description?: string;
}

interface AssignedRole extends Role {
  assigned_at: string;
}

export function LicenseRoleAssignment({ licenseId }: { licenseId: string }) {
  const [assignedRoles, setAssignedRoles] = useState<AssignedRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAssignedRoles();
    loadAvailableRoles();
  }, [licenseId]);

  const loadAssignedRoles = async () => {
    const { data, error } = await supabase
      .from('license_roles')
      .select('role_id, assigned_at, roles(id, name, description)')
      .eq('license_id', licenseId);

    if (!error && data) {
      setAssignedRoles(data.map(d => ({
        id: d.roles.id,
        name: d.roles.name,
        description: d.roles.description,
        assigned_at: d.assigned_at
      })));
    }
  };

  const loadAvailableRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name, description')
      .order('name');

    if (!error && data) setAvailableRoles(data);
  };

  const toggleRole = async (roleId: string, isAssigned: boolean) => {
    setLoading(true);
    
    if (isAssigned) {
      const { error } = await supabase
        .from('license_roles')
        .delete()
        .eq('license_id', licenseId)
        .eq('role_id', roleId);

      if (error) {
        toast.error('Failed to remove role');
      } else {
        toast.success('Role removed');
        loadAssignedRoles();
      }
    } else {
      const { error } = await supabase
        .from('license_roles')
        .insert({ license_id: licenseId, role_id: roleId });

      if (error) {
        toast.error('Failed to assign role');
      } else {
        toast.success('Role assigned');
        loadAssignedRoles();
      }
    }
    
    setLoading(false);
  };

  const isRoleAssigned = (roleId: string) => 
    assignedRoles.some(r => r.id === roleId);

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Assigned Roles</h4>
        <div className="flex flex-wrap gap-2">
          {assignedRoles.map(role => (
            <Badge key={role.id} variant="secondary" className="px-3 py-1">
              {role.name}
              <button onClick={() => toggleRole(role.id, true)} className="ml-2">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {assignedRoles.length === 0 && (
            <p className="text-sm text-muted-foreground">No roles assigned</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Available Roles</h4>
        <Card className="p-4 space-y-3">
          {availableRoles.map(role => {
            const assigned = isRoleAssigned(role.id);
            return (
              <div key={role.id} className="flex items-start space-x-3">
                <Checkbox
                  checked={assigned}
                  onCheckedChange={() => toggleRole(role.id, assigned)}
                  disabled={loading}
                />
                <div className="flex-1">
                  <label className="text-sm font-medium cursor-pointer">
                    {role.name}
                  </label>
                  {role.description && (
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
