import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Building2, Plus } from 'lucide-react';

export function OrganizationCreator() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    size: '',
    website: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: formData.name,
          description: formData.description || null,
          settings: {
            industry: formData.industry,
            size: formData.size,
            website: formData.website,
            phone: formData.phone
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Organization "${formData.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        industry: '',
        size: '',
        website: '',
        phone: ''
      });
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-2 border-blue-400">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2 text-white font-bold">
          <Building2 className="w-6 h-6 text-blue-400" />
          Create New Organization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-blue-300">Organization Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-black/30 text-white border-blue-500/50"
                placeholder="Acme Construction"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-blue-300">Industry</Label>
              <Select value={formData.industry} onValueChange={(val) => setFormData({...formData, industry: val})}>
                <SelectTrigger className="bg-black/30 text-white border-blue-500/50">
                  <SelectValue placeholder="Select industry..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="architecture">Architecture</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-blue-300">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="bg-black/30 text-white border-blue-500/50"
              placeholder="Brief description of the organization..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-blue-300">Company Size</Label>
              <Select value={formData.size} onValueChange={(val) => setFormData({...formData, size: val})}>
                <SelectTrigger className="bg-black/30 text-white border-blue-500/50">
                  <SelectValue placeholder="Select size..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10</SelectItem>
                  <SelectItem value="11-50">11-50</SelectItem>
                  <SelectItem value="51-200">51-200</SelectItem>
                  <SelectItem value="201-500">201-500</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-blue-300">Website</Label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({...formData, website: e.target.value})}
                className="bg-black/30 text-white border-blue-500/50"
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-blue-300">Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="bg-black/30 text-white border-blue-500/50"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
