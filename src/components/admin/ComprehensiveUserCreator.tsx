import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserPlus, Building2, Mail, Key, Shield, Globe } from 'lucide-react';

export function ComprehensiveUserCreator() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    organization_id: '',
    organization_role: 'member', // owner, admin, member
    role: 'user',
    user_type: 'client', // client or employee
    license_id: '',
    allowed_domains: '',
    subscription_tier: 'free',
    subscription_status: 'trial'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    loadLicenses(); 
    loadOrganizations();
  }, []);

  const loadLicenses = async () => {
    const { data } = await supabase
      .from('license_keys')
      .select('*')
      .eq('is_active', true)
      .order('organization_name');
    if (data) setLicenses(data);
  };

  const loadOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .order('name');
    if (data) setOrganizations(data);
  };



  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalOrgId = formData.organization_id;

      // If company_name is provided and no organization selected, create new organization
      if (formData.company_name && (!formData.organization_id || formData.organization_id === 'none')) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: formData.company_name,
            settings: {}
          })
          .select()
          .single();

        if (orgError) throw new Error(`Failed to create organization: ${orgError.message}`);
        finalOrgId = newOrg.id;
        toast.success(`Organization "${formData.company_name}" created`);
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            user_type: formData.user_type
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Create/update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          company_name: formData.company_name,
          organization_id: finalOrgId || null,
          role: formData.role,
          user_type: formData.user_type,
          subscription_tier: formData.subscription_tier,
          subscription_status: formData.subscription_status
        });

      if (profileError) throw profileError;

      // Add user to organization if organization exists
      if (finalOrgId) {
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: finalOrgId,
            user_id: authData.user.id,
            role: formData.organization_role
          });

        if (memberError) {
          console.error('Organization membership error:', memberError);
          toast.warning('User created but failed to add to organization');
        }
      }

      // Assign license if selected
      if (formData.license_id && formData.license_id !== 'none') {
        const { error: licenseError } = await supabase
          .from('license_users')
          .insert({
            user_id: authData.user.id,
            license_id: formData.license_id
          });
        if (licenseError) console.error('License assignment error:', licenseError);
      }

      toast.success(`${formData.user_type === 'employee' ? 'Employee' : 'Client'} created successfully!`);
      
      // Reset form
      setFormData({
        email: '', password: '', full_name: '', company_name: '',
        organization_id: '', organization_role: 'member',
        role: 'user', user_type: 'client', license_id: '',
        allowed_domains: '', subscription_tier: 'free', subscription_status: 'trial'
      });

      // Reload organizations list
      loadOrganizations();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="bg-white/10 backdrop-blur-lg border-2 border-green-400">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2 text-white font-bold">
          <UserPlus className="w-6 h-6 text-green-400" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-green-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-black/30 text-white border-green-500/50"
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-green-300 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Password
              </Label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="bg-black/30 text-white border-green-500/50"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-green-300">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="bg-black/30 text-white border-green-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-green-300 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Name
              </Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                className="bg-black/30 text-white border-green-500/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-green-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Organization (Optional)
            </Label>
            <Select value={formData.organization_id} onValueChange={(val) => setFormData({...formData, organization_id: val})}>
              <SelectTrigger className="bg-black/30 text-white border-green-500/50">
                <SelectValue placeholder="Select existing or leave blank to create new..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Create New from Company Name</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-green-400/70">
              Select existing organization or leave blank. If Company Name is filled and no org selected, a new organization will be created.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-green-300">Organization Role</Label>
            <Select value={formData.organization_role} onValueChange={(val) => setFormData({...formData, organization_role: val})}>
              <SelectTrigger className="bg-black/30 text-white border-green-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-green-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                User Type
              </Label>
              <Select value={formData.user_type} onValueChange={(val) => setFormData({...formData, user_type: val})}>
                <SelectTrigger className="bg-black/30 text-white border-green-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-green-300">Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                <SelectTrigger className="bg-black/30 text-white border-green-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-green-300">Subscription Tier</Label>
              <Select value={formData.subscription_tier} onValueChange={(val) => setFormData({...formData, subscription_tier: val})}>
                <SelectTrigger className="bg-black/30 text-white border-green-500/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-green-300">Subscription Status</Label>
              <Select value={formData.subscription_status} onValueChange={(val) => setFormData({...formData, subscription_status: val})}>
                <SelectTrigger className="bg-black/30 text-white border-green-500/50">
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
          </div>

          <div className="space-y-2">
            <Label className="text-green-300">Assign License (Optional)</Label>
            <Select value={formData.license_id} onValueChange={(val) => setFormData({...formData, license_id: val})}>
              <SelectTrigger className="bg-black/30 text-white border-green-500/50">
                <SelectValue placeholder="Select a license..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No License</SelectItem>
                {licenses.map((license) => (
                  <SelectItem key={license.id} value={license.id}>
                    {license.organization_name} - {license.license_key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold"
          >
            {loading ? 'Creating...' : `Create ${formData.user_type === 'employee' ? 'Employee' : 'Client'}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
