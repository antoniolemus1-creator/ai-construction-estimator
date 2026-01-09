import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';

export function OrganizationSettings() {
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    industry: ''
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (org) {
          setOrganization(org);
          setFormData({
            name: org.name || '',
            description: org.description || '',
            website: org.website || '',
            industry: org.industry || ''
          });
        }
      }
    } catch (error: any) {
      console.error('Error loading organization:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('manage-organization', {
        body: {
          action: 'update',
          organizationId: organization.id,
          organizationData: formData
        }
      });

      if (error) throw error;

      toast.success('Organization updated successfully!');
      loadOrganization();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No organization found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Organization Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}