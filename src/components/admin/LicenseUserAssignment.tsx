import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AssignedUser extends User {
  assigned_at: string;
}

export function LicenseUserAssignment({ licenseId }: { licenseId: string }) {
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAssignedUsers();
    loadAvailableUsers();
  }, [licenseId]);

  const loadAssignedUsers = async () => {
    const { data, error } = await supabase
      .from('license_users')
      .select('user_id, assigned_at, user_profiles(id, email, full_name)')
      .eq('license_id', licenseId);

    if (!error && data) {
      setAssignedUsers(data.map(d => ({
        id: d.user_profiles.id,
        email: d.user_profiles.email,
        full_name: d.user_profiles.full_name,
        assigned_at: d.assigned_at
      })));
    }
  };

  const loadAvailableUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .order('email');

    if (!error && data) setAvailableUsers(data);
  };

  const assignUser = async (userId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('license_users')
      .insert({ license_id: licenseId, user_id: userId });

    if (error) {
      toast.error('Failed to assign user');
    } else {
      toast.success('User assigned successfully');
      loadAssignedUsers();
    }
    setLoading(false);
  };

  const removeUser = async (userId: string) => {
    const { error } = await supabase
      .from('license_users')
      .delete()
      .eq('license_id', licenseId)
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to remove user');
    } else {
      toast.success('User removed');
      loadAssignedUsers();
    }
  };

  const filteredUsers = availableUsers.filter(u => 
    !assignedUsers.some(au => au.id === u.id) &&
    (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Assigned Users</h4>
        <div className="flex flex-wrap gap-2">
          {assignedUsers.map(user => (
            <Badge key={user.id} variant="secondary" className="px-3 py-1">
              {user.email}
              <button onClick={() => removeUser(user.id)} className="ml-2">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {assignedUsers.length === 0 && (
            <p className="text-sm text-muted-foreground">No users assigned</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Add Users</h4>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Card className="max-h-48 overflow-y-auto p-2">
          {filteredUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
              <span className="text-sm">{user.email}</span>
              <Button size="sm" variant="ghost" onClick={() => assignUser(user.id)} disabled={loading}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
