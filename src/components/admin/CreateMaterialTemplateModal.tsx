import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMaterialTemplateModal({ onClose, onSuccess }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    template_category: 'lumber',
    unit: 'LF',
    typical_waste_percentage: 10,
    default_cost_code: '',
    section: '',
    calc_method: 'linear_feet',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('material_templates')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Template created successfully',
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
          <h2 className="text-xl font-semibold">Create Material Template</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Template Category *</Label>
              <select
                value={formData.template_category}
                onChange={(e) => setFormData({ ...formData, template_category: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="lumber">Lumber</option>
                <option value="drywall">Drywall</option>
                <option value="metal_framing">Metal Framing</option>
                <option value="insulation">Insulation</option>
                <option value="fasteners">Fasteners</option>
                <option value="paint">Paint</option>
                <option value="flooring">Flooring</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="concrete">Concrete</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Unit *</Label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="LF">Linear Feet (LF)</option>
                <option value="SF">Square Feet (SF)</option>
                <option value="EA">Each (EA)</option>
                <option value="CY">Cubic Yards (CY)</option>
                <option value="GAL">Gallons (GAL)</option>
                <option value="LB">Pounds (LB)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Typical Waste % *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.typical_waste_percentage}
                onChange={(e) => setFormData({ ...formData, typical_waste_percentage: parseFloat(e.target.value) })}
                required
              />
            </div>
            <div>
              <Label>Default Cost Code</Label>
              <Input
                value={formData.default_cost_code}
                onChange={(e) => setFormData({ ...formData, default_cost_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Section</Label>
              <Input
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
            <div>
              <Label>Calculation Method</Label>
              <Input
                value={formData.calc_method}
                onChange={(e) => setFormData({ ...formData, calc_method: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
