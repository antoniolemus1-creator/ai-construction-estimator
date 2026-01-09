import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Key, Plus, Calendar, Trash2, Users, Shield, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LicenseSearchFilter } from './LicenseSearchFilter';
import { LicenseActivationRequests } from './LicenseActivationRequests';
import { LicenseDomainManager } from './LicenseDomainManager';
import { LicenseUserAssignment } from './LicenseUserAssignment';
import { LicenseRoleAssignment } from './LicenseRoleAssignment';


interface License {
  id: string;
  license_key: string;
  organization_name: string;
  allowed_domains: string[];
  max_activations: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export function ComprehensiveLicenseManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expiryFilter, setExpiryFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => { loadLicenses(); }, []);
  
  useEffect(() => {
    filterLicenses();
  }, [licenses, searchTerm, statusFilter, expiryFilter]);

  const loadLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('license_keys')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setLicenses(data);
    setLoading(false);
  };

  const filterLicenses = () => {
    let filtered = [...licenses];
    
    if (searchTerm) {
      filtered = filtered.filter(l => 
        l.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(l => {
        const expired = new Date(l.expires_at) < now;
        if (statusFilter === 'active') return l.is_active && !expired;
        if (statusFilter === 'inactive') return !l.is_active;
        if (statusFilter === 'expired') return expired;
        return true;
      });
    }
    
    if (expiryFilter !== 'all') {
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(l => {
        const expiry = new Date(l.expires_at);
        if (expiryFilter === 'expiring_soon') return expiry > now && expiry < thirtyDays;
        if (expiryFilter === 'expired') return expiry < now;
        if (expiryFilter === 'valid') return expiry > now;
        return true;
      });
    }
    
    setFilteredLicenses(filtered);
  };

  const handleExtendExpiry = async (licenseId: string, months: number) => {
    const license = licenses.find(l => l.id === licenseId);
    if (!license) return;
    
    const currentExpiry = new Date(license.expires_at);
    const newExpiry = new Date(currentExpiry.setMonth(currentExpiry.getMonth() + months));
    
    const { error } = await supabase
      .from('license_keys')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('id', licenseId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to extend expiry', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Extended by ${months} months` });
      loadLicenses();
    }
  };

  const handleRevoke = async (licenseId: string) => {
    if (!confirm('Revoke this license? This action cannot be undone.')) return;
    
    const { error } = await supabase
      .from('license_keys')
      .update({ is_active: false })
      .eq('id', licenseId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to revoke license', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'License revoked' });
      loadLicenses();
    }
  };

  const handleCreateLicense = async (formData: any) => {
    const { error } = await supabase
      .from('license_keys')
      .insert([{
        license_key: formData.license_key,
        organization_name: formData.organization_name,
        allowed_domains: formData.allowed_domains,
        max_activations: formData.max_activations,
        expires_at: formData.expires_at,
        is_active: true
      }]);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to create license', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'License created' });
      loadLicenses();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-lg border-2 border-cyan-400">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl flex items-center gap-2 text-white font-bold">
              <Key className="w-6 h-6 text-cyan-400" />
              License Management
            </CardTitle>
            <CreateLicenseDialog onCreate={handleCreateLicense} />
          </div>
        </CardHeader>
        <CardContent>
          <LicenseSearchFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            expiryFilter={expiryFilter}
            setExpiryFilter={setExpiryFilter}
          />
          
          {loading ? (
            <p className="text-white">Loading...</p>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-400">
                Showing {filteredLicenses.length} of {licenses.length} licenses
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-cyan-300">License Key</TableHead>
                    <TableHead className="text-cyan-300">Organization</TableHead>
                    <TableHead className="text-cyan-300">Status</TableHead>
                    <TableHead className="text-cyan-300">Domains</TableHead>
                    <TableHead className="text-cyan-300">Expires</TableHead>
                    <TableHead className="text-cyan-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLicenses.map((license) => {
                    const expired = new Date(license.expires_at) < new Date();
                    return (
                      <TableRow key={license.id}>
                        <TableCell className="text-white font-mono text-sm">{license.license_key}</TableCell>
                        <TableCell className="text-white">{license.organization_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={license.is_active && !expired ? 'default' : 'destructive'}>
                            {expired ? 'Expired' : license.is_active ? 'Active' : 'Revoked'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{license.allowed_domains?.length || 0}</TableCell>
                        <TableCell className="text-white">{new Date(license.expires_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <ManageLicenseDialog license={license} onUpdate={loadLicenses} />
                            <ExtendExpiryDialog licenseId={license.id} onExtend={handleExtendExpiry} />
                            <Button size="sm" variant="destructive" onClick={() => handleRevoke(license.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
      
      <LicenseActivationRequests />
    </div>
  );
}

function CreateLicenseDialog({ onCreate }: any) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    license_key: 'LIC-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    organization_name: '',
    allowed_domains: '',
    max_activations: 5,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const handleSubmit = () => {
    onCreate({
      ...formData,
      allowed_domains: formData.allowed_domains.split(',').map(d => d.trim()).filter(Boolean)
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-cyan-500 hover:bg-cyan-600">
          <Plus className="w-4 h-4 mr-2" />
          Create License
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f1419] border-cyan-400">
        <DialogHeader>
          <DialogTitle className="text-white">Create New License</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-cyan-300">License Key</Label>
            <Input value={formData.license_key} onChange={(e) => setFormData({...formData, license_key: e.target.value})} className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Organization Name</Label>
            <Input value={formData.organization_name} onChange={(e) => setFormData({...formData, organization_name: e.target.value})} className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Allowed Domains (comma-separated)</Label>
            <Input placeholder="example.com, app.example.com" value={formData.allowed_domains} onChange={(e) => setFormData({...formData, allowed_domains: e.target.value})} className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Max Activations</Label>
            <Input type="number" value={formData.max_activations} onChange={(e) => setFormData({...formData, max_activations: parseInt(e.target.value)})} className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Expiration Date</Label>
            <Input type="date" value={formData.expires_at} onChange={(e) => setFormData({...formData, expires_at: e.target.value})} className="bg-black/30 text-white" />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-cyan-500 hover:bg-cyan-600">
            Create License
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExtendExpiryDialog({ licenseId, onExtend }: any) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState(12);

  const handleExtend = () => {
    onExtend(licenseId, months);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Calendar className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f1419] border-cyan-400">
        <DialogHeader>
          <DialogTitle className="text-white">Extend Expiration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-cyan-300">Extend by (months)</Label>
            <Input type="number" value={months} onChange={(e) => setMonths(parseInt(e.target.value))} className="bg-black/30 text-white" />
          </div>
          <Button onClick={handleExtend} className="w-full bg-cyan-500 hover:bg-cyan-600">
            Extend License
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


function ManageLicenseDialog({ license, onUpdate }: { license: License; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <Shield className="w-4 h-4" />
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f1419] border-cyan-400 max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            Manage License: {license.license_key}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/30">
            <TabsTrigger value="domains" className="data-[state=active]:bg-cyan-500">
              <Globe className="w-4 h-4 mr-2" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-cyan-500">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-cyan-500">
              <Shield className="w-4 h-4 mr-2" />
              Roles
            </TabsTrigger>
          </TabsList>
          <TabsContent value="domains" className="mt-4">
            <LicenseDomainManager
              licenseId={license.id}
              licenseKey={license.license_key}
              domains={license.allowed_domains || []}
              onUpdate={onUpdate}
            />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <LicenseUserAssignment licenseId={license.id} />
          </TabsContent>
          <TabsContent value="roles" className="mt-4">
            <LicenseRoleAssignment licenseId={license.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
