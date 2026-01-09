import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface Template {
  id: string;
  name: string;
  category: string;
  template_category: string;
  unit: string;
  typical_waste_percentage: number;
  default_cost_code: string;
  section: string;
  calc_method: string;
}

export function AddMaterialFromTemplateModal({ onClose, onSuccess }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    material_code: '',
    price: 0,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('material_templates')
        .select('*')
        .order('template_category');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('construction_materials')
        .insert([{
          name: formData.name,
          brand: formData.brand,
          material_code: formData.material_code,
          category: selectedTemplate.category,
          unit: selectedTemplate.unit,
          price: formData.price,
          waste_percentage: selectedTemplate.typical_waste_percentage,
          cost_code: selectedTemplate.default_cost_code,
          section: selectedTemplate.section,
          calc_method: selectedTemplate.calc_method,
          notes: formData.notes,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Material added successfully',
      });
      onSuccess();
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Add Material from Template</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label>Select Template *</Label>
            <select
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Choose a template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.template_category})
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <>
              <div className="bg-blue-50 p-4 rounded-md space-y-2 text-sm">
                <p><strong>Category:</strong> {selectedTemplate.category}</p>
                <p><strong>Unit:</strong> {selectedTemplate.unit}</p>
                <p><strong>Waste %:</strong> {selectedTemplate.typical_waste_percentage}%</p>
                <p><strong>Cost Code:</strong> {selectedTemplate.default_cost_code}</p>
              </div>

              <div>
                <Label>Material Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 2x4 Stud - 8ft"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Brand</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g., Georgia Pacific"
                  />
                </div>
                <div>
                  <Label>Material Code</Label>
                  <Input
                    value={formData.material_code}
                    onChange={(e) => setFormData({ ...formData, material_code: e.target.value })}
                    placeholder="e.g., LUM-2X4-8"
                  />
                </div>
              </div>

              <div>
                <Label>Price per {selectedTemplate.unit} *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedTemplate}>
              {loading ? 'Adding...' : 'Add Material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
