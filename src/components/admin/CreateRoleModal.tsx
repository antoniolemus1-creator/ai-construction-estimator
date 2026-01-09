import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export function CreateRoleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    const { data } = await supabase.from('permissions').select('*').order('category');
    if (data) setPermissions(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .insert({ name, description })
        .select()
        .single();

      if (roleError) throw roleError;

      if (selectedPermissions.length > 0) {
        const { error: permError } = await supabase
          .from('role_permissions')
          .insert(selectedPermissions.map(p => ({ role_id: role.id, permission_id: p })));
        if (permError) throw permError;
      }

      toast.success('Role created successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Role Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label className="text-lg font-semibold mb-3 block">Permissions</Label>
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="mb-4">
                <h4 className="font-medium mb-2">{category}</h4>
                {perms.map((perm) => (
                  <div key={perm.id} className="flex items-center space-x-2 mb-2">
                    <Checkbox
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={(checked) => {
                        setSelectedPermissions(checked 
                          ? [...selectedPermissions, perm.id]
                          : selectedPermissions.filter(p => p !== perm.id)
                        );
                      }}
                    />
                    <Label className="text-sm">{perm.description}</Label>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>Create Role</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
