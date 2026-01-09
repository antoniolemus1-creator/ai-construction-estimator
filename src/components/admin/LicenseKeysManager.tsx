import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { Key, Plus, Edit, Trash2, RefreshCw, Shield, Calendar, Building, Mail, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface License {
  id: string;
  license_key: string;
  company_name: string;
  contact_email: string;
  allowed_domains: string[];
  max_activations: number;
  current_activations: number;
  hardware_fingerprints: string[];
  expires_at: string;
  is_active: boolean;
  created_at: string;
}

export function LicenseKeysManager() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadLicenses(); }, []);

  const loadLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('manage-license-keys', {
      body: { action: 'list' }
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load licenses', variant: 'destructive' });
    } else {
      setLicenses(data.data || []);
    }
    setLoading(false);
  };

  const generateKey = () => {
    return 'LIC-' + Array.from({ length: 4 }, () => 
      Math.random().toString(36).substring(2, 6).toUpperCase()
    ).join('-');
  };

  const handleCreate = async (formData: any) => {
    const { error } = await supabase.functions.invoke('manage-license-keys', {
      body: { action: 'create', licenseData: formData }
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to create license', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'License created successfully' });
      setShowCreateDialog(false);
      loadLicenses();
    }
  };

  const handleUpdate = async (licenseId: string, formData: any) => {
    const { error } = await supabase.functions.invoke('manage-license-keys', {
      body: { action: 'update', licenseId, licenseData: formData }
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to update license', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'License updated successfully' });
      setEditingLicense(null);
      loadLicenses();
    }
  };

  const handleDeactivate = async (licenseId: string) => {
    if (!confirm('Are you sure you want to deactivate this license?')) return;
    const { error } = await supabase.functions.invoke('manage-license-keys', {
      body: { action: 'deactivate', licenseId }
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to deactivate license', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'License deactivated' });
      loadLicenses();
    }
  };

  const handleResetFingerprints = async (licenseId: string) => {
    if (!confirm('Reset all hardware fingerprints for this license?')) return;
    const { error } = await supabase.functions.invoke('manage-license-keys', {
      body: { action: 'reset_fingerprints', licenseId }
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to reset fingerprints', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Fingerprints reset successfully' });
      loadLicenses();
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-2 border-cyan-400">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center gap-2 text-white font-bold">
            <Key className="w-6 h-6 text-cyan-400" />
            License Keys Management
          </CardTitle>
          <LicenseFormDialog
            trigger={
              <Button className="bg-cyan-500 hover:bg-cyan-600">
                <Plus className="w-4 h-4 mr-2" />
                Create License
              </Button>
            }
            onSubmit={handleCreate}
            generateKey={generateKey}
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-cyan-300">License Key</TableHead>
                <TableHead className="text-cyan-300">Company</TableHead>
                <TableHead className="text-cyan-300">Status</TableHead>
                <TableHead className="text-cyan-300">Activations</TableHead>
                <TableHead className="text-cyan-300">Expires</TableHead>
                <TableHead className="text-cyan-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="text-white font-mono text-sm">{license.license_key}</TableCell>
                  <TableCell className="text-white">{license.company_name}</TableCell>
                  <TableCell>
                    <Badge variant={license.is_active ? 'default' : 'destructive'}>
                      {license.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">
                    {license.current_activations}/{license.max_activations}
                  </TableCell>
                  <TableCell className="text-white">
                    {new Date(license.expires_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <LicenseDetailsDialog license={license} />
                      <Button size="sm" variant="outline" onClick={() => handleResetFingerprints(license.id)}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeactivate(license.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function LicenseFormDialog({ trigger, onSubmit, generateKey, initialData }: any) {
  const [formData, setFormData] = useState(initialData || {
    license_key: generateKey(),
    company_name: '',
    contact_email: '',
    allowed_domains: '',
    max_activations: 1,
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-[#0f1419] border-cyan-400 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">License Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-cyan-300">License Key</Label>
            <Input value={formData.license_key} readOnly className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Company Name</Label>
            <Input value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Contact Email</Label>
            <Input type="email" value={formData.contact_email} onChange={(e) => setFormData({...formData, contact_email: e.target.value})} className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Allowed Domains (comma-separated)</Label>
            <Input value={formData.allowed_domains} onChange={(e) => setFormData({...formData, allowed_domains: e.target.value})} className="bg-black/30 text-white" placeholder="example.com, app.example.com" />
          </div>
          <div>
            <Label className="text-cyan-300">Max Activations</Label>
            <Input type="number" value={formData.max_activations} onChange={(e) => setFormData({...formData, max_activations: parseInt(e.target.value)})} className="bg-black/30 text-white" />
          </div>
          <div>
            <Label className="text-cyan-300">Expiration Date</Label>
            <Input type="date" value={formData.expires_at} onChange={(e) => setFormData({...formData, expires_at: e.target.value})} className="bg-black/30 text-white" />
          </div>
          <Button onClick={() => onSubmit({
            ...formData,
            allowed_domains: formData.allowed_domains.split(',').map((d: string) => d.trim())
          })} className="w-full bg-cyan-500 hover:bg-cyan-600">
            Save License
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LicenseDetailsDialog({ license }: { license: License }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Shield className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f1419] border-cyan-400 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">License Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-cyan-300 text-sm">License Key</p>
              <p className="font-mono">{license.license_key}</p>
            </div>
            <div>
              <p className="text-cyan-300 text-sm">Company</p>
              <p>{license.company_name}</p>
            </div>
            <div>
              <p className="text-cyan-300 text-sm">Contact Email</p>
              <p>{license.contact_email}</p>
            </div>
            <div>
              <p className="text-cyan-300 text-sm">Status</p>
              <Badge variant={license.is_active ? 'default' : 'destructive'}>
                {license.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-cyan-300 text-sm mb-2">Allowed Domains</p>
            <div className="flex flex-wrap gap-2">
              {license.allowed_domains.map((domain, idx) => (
                <Badge key={idx} variant="outline">{domain}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-cyan-300 text-sm mb-2">Hardware Fingerprints ({license.hardware_fingerprints.length})</p>
            <div className="bg-black/30 p-3 rounded max-h-40 overflow-y-auto">
              {license.hardware_fingerprints.map((fp, idx) => (
                <p key={idx} className="font-mono text-xs">{fp}</p>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-cyan-300 text-sm">Activations</p>
              <p>{license.current_activations}/{license.max_activations}</p>
            </div>
            <div>
              <p className="text-cyan-300 text-sm">Created</p>
              <p>{new Date(license.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-cyan-300 text-sm">Expires</p>
              <p>{new Date(license.expires_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}