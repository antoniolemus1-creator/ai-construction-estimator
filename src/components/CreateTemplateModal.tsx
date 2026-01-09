import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Material {
  material_name: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
}

export function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [isPublic, setIsPublic] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([
    { material_name: '', description: '', quantity: 0, unit: 'EA', category: '' }
  ]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const addMaterial = () => {
    setMaterials([...materials, { material_name: '', description: '', quantity: 0, unit: 'EA', category: '' }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: keyof Material, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
      return;
    }

    const validMaterials = materials.filter(m => m.material_name.trim() && m.quantity > 0);
    if (validMaterials.length === 0) {
      toast({ title: 'Error', description: 'Add at least one material', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: template, error: templateError } = await supabase
      .from('project_templates')
      .insert({
        user_id: user?.id,
        name,
        description,
        category,
        is_public: isPublic
      })
      .select()
      .single();

    if (templateError || !template) {
      toast({ title: 'Error', description: 'Failed to create template', variant: 'destructive' });
      setSaving(false);
      return;
    }

    const materialsToInsert = validMaterials.map((m, i) => ({
      template_id: template.id,
      ...m,
      sort_order: i
    }));

    const { error: materialsError } = await supabase
      .from('template_materials')
      .insert(materialsToInsert);

    setSaving(false);

    if (materialsError) {
      toast({ title: 'Error', description: 'Failed to add materials', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Template created successfully' });
    onCreated();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Template Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Kitchen Remodel Package" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe this template..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Custom">Custom</SelectItem>
                  <SelectItem value="Framing">Framing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Concrete">Concrete</SelectItem>
                  <SelectItem value="Drywall">Drywall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Label>Make Public</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Materials</Label>
              <Button size="sm" onClick={addMaterial}>
                <Plus className="h-4 w-4 mr-1" />
                Add Material
              </Button>
            </div>
            {materials.map((material, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                <div className="col-span-3">
                  <Input
                    placeholder="Material name"
                    value={material.material_name}
                    onChange={(e) => updateMaterial(index, 'material_name', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={material.quantity || ''}
                    onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value))}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="Unit"
                    value={material.unit}
                    onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="Category"
                    value={material.category}
                    onChange={(e) => updateMaterial(index, 'category', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    placeholder="Description"
                    value={material.description}
                    onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <Button size="sm" variant="ghost" onClick={() => removeMaterial(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
