import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateMaterialTemplateModal } from './CreateMaterialTemplateModal';
import { EditMaterialTemplateModal } from './EditMaterialTemplateModal';

interface MaterialTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template_category: string;
  unit: string;
  typical_waste_percentage: number;
  default_cost_code: string;
  section: string;
  calc_method: string;
  notes: string;
}

export function MaterialTemplatesManager() {
  const [templates, setTemplates] = useState<MaterialTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<MaterialTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MaterialTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchTerm, selectedCategory, templates]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('material_templates')
        .select('*')
        .order('template_category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.template_category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('material_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const categories = ['all', 'lumber', 'drywall', 'metal_framing', 'insulation', 'fasteners', 'paint', 'flooring', 'electrical', 'plumbing', 'concrete'];

  if (loading) {
    return <div className="flex justify-center p-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Material Templates</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium">{template.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unit:</span>
                    <span className="ml-2 font-medium">{template.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Waste %:</span>
                    <span className="ml-2 font-medium">{template.typical_waste_percentage}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost Code:</span>
                    <span className="ml-2 font-medium">{template.default_cost_code}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showCreateModal && (
        <CreateMaterialTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTemplates();
          }}
        />
      )}

      {editingTemplate && (
        <EditMaterialTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSuccess={() => {
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}
