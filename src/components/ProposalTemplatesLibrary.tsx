import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Search, Share2, Clock, Edit, Trash2 } from 'lucide-react';
import { CreateProposalTemplateModal } from './CreateProposalTemplateModal';
import { ProposalVersionHistory } from './ProposalVersionHistory';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  company_name: string;
}

export function ProposalTemplatesLibrary() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    
    try {
      const { error } = await supabase
        .from('proposal_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const filtered = templates.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Proposal Templates</h2>
          <p className="text-muted-foreground">Reusable proposal templates for faster client proposals</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex gap-2">
                  {template.is_public && <Badge variant="secondary">Public</Badge>}
                  <Badge variant="outline">v{template.version}</Badge>
                </div>
              </div>
              <CardTitle className="mt-4">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {template.company_name && (
                  <p className="text-sm text-muted-foreground">{template.company_name}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedTemplate(template);
                    setShowCreate(true);
                  }}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setSelectedTemplate(template);
                    setShowVersions(true);
                  }}>
                    <Clock className="h-4 w-4 mr-1" />
                    Versions
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteTemplate(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreate && (
        <CreateProposalTemplateModal
          template={selectedTemplate}
          onClose={() => {
            setShowCreate(false);
            setSelectedTemplate(null);
          }}
          onSuccess={loadTemplates}
        />
      )}

      {showVersions && selectedTemplate && (
        <ProposalVersionHistory
          templateId={selectedTemplate.id}
          onClose={() => {
            setShowVersions(false);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}