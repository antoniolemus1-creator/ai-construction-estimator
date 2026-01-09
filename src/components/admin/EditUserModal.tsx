import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface EditUserModalProps {
  user: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ user, open, onClose, onSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    email: user.email || '',
    company_name: user.company_name || '',
    role: user.role || 'user',
    subscription_tier: user.subscription_tier || 'free',
    subscription_status: user.subscription_status || 'trial',
    allow_shared_learning: user.allow_shared_learning || false
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase.functions.invoke('update-user-admin', {
        body: {
          userId: user.id,
          updates: formData,
          adminId: currentUser?.id,
          adminEmail: currentUser?.email
        }
      });

      if (error) throw error;
      toast.success('User updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>
          <div>
            <Label>Company</Label>
            <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subscription Tier</Label>
            <Select value={formData.subscription_tier} onValueChange={(val) => setFormData({...formData, subscription_tier: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={formData.subscription_status} onValueChange={(val) => setFormData({...formData, subscription_status: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Shared Learning</Label>
            <Switch checked={formData.allow_shared_learning} onCheckedChange={(val) => setFormData({...formData, allow_shared_learning: val})} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
