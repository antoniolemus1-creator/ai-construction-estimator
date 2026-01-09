import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, FileText, Users, Star } from 'lucide-react';
import { CreateTemplateModal } from './CreateTemplateModal';
import { TemplateDetailsModal } from './TemplateDetailsModal';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  is_system_template: boolean;
  usage_count: number;
  created_at: string;
  material_count?: number;
}

export function TemplateLibrary({ onSelectTemplate }: { onSelectTemplate: (template: Template) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_templates')
      .select('*, template_materials(count)')
      .order('is_system_template', { ascending: false })
      .order('usage_count', { ascending: false });

    if (!error && data) {
      const templatesWithCount = data.map(t => ({
        ...t,
        material_count: t.template_materials?.[0]?.count || 0
      }));
      setTemplates(templatesWithCount);
    }
    setLoading(false);
  };

  const filterTemplates = () => {
    let filtered = templates;
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }
    setFilteredTemplates(filtered);
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Project Templates</h2>
          <p className="text-muted-foreground">Start with pre-built templates or create your own</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="capitalize">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                {template.is_system_template && <Badge variant="secondary">System</Badge>}
              </div>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <FileText className="inline h-4 w-4 mr-1" />
                    {template.material_count} materials
                  </span>
                  <span className="text-muted-foreground">
                    <Star className="inline h-4 w-4 mr-1" />
                    {template.usage_count} uses
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={() => setSelectedTemplate(template)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => onSelectTemplate(template)}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadTemplates}
        />
      )}

      {selectedTemplate && (
        <TemplateDetailsModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUse={() => {
            onSelectTemplate(selectedTemplate);
            setSelectedTemplate(null);
          }}
        />
      )}
    </div>
  );
}
