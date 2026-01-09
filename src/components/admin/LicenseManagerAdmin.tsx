import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Key, Plus, Trash2, Edit, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LicenseManagerAdmin() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLicense, setNewLicense] = useState({
    email: '',
    organization: '',
    tier: 'professional',
    duration_days: 365
  });

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (err) {
      toast.error('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const createLicense = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-license-keys', {
        body: {
          action: 'create',
          ...newLicense
        }
      });

      if (error) throw error;
      toast.success('License created successfully');
      setIsCreateOpen(false);
      loadLicenses();
    } catch (err) {
      toast.error('Failed to create license');
    }
  };

  const revokeLicense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('license_keys')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) throw error;
      toast.success('License revoked');
      loadLicenses();
    } catch (err) {
      toast.error('Failed to revoke license');
    }
  };

  const filteredLicenses = licenses.filter(l =>
    l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.license_key?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          License Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create License
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New License</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={newLicense.email}
                    onChange={(e) => setNewLicense({ ...newLicense, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Organization</Label>
                  <Input
                    value={newLicense.organization}
                    onChange={(e) => setNewLicense({ ...newLicense, organization: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tier</Label>
                  <Select value={newLicense.tier} onValueChange={(v) => setNewLicense({ ...newLicense, tier: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    value={newLicense.duration_days}
                    onChange={(e) => setNewLicense({ ...newLicense, duration_days: parseInt(e.target.value) })}
                  />
                </div>
                <Button onClick={createLicense} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell>{license.email}</TableCell>
                <TableCell>{license.organization}</TableCell>
                <TableCell className="font-mono text-xs">{license.license_key?.substring(0, 20)}...</TableCell>
                <TableCell>
                  <Badge variant={license.status === 'active' ? 'default' : 'destructive'}>
                    {license.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(license.expires_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeLicense(license.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
