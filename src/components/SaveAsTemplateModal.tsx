import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Material {
  name: string;
  quantity: number;
  unit: string;
}

interface SaveAsTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materials: Material[];
  onSuccess?: () => void;
}

export default function SaveAsTemplateModal({ open, onOpenChange, materials, onSuccess }: SaveAsTemplateModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('custom');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editedMaterials, setEditedMaterials] = useState(materials);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const updateQuantity = (index: number, quantity: number) => {
    const updated = [...editedMaterials];
    updated[index].quantity = quantity;
    setEditedMaterials(updated);
  };

  const saveTemplate = async () => {
    if (!name.trim()) {
      toast({ title: 'Error', description: 'Please enter a template name', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: template, error: templateError } = await supabase
        .from('project_templates')
        .insert({
          name: name.trim(),
          description: description.trim(),
          category,
          is_public: isPublic,
          created_by: user.id
        })
        .select()
        .single();

      if (templateError) throw templateError;

      const templateMaterials = editedMaterials.map(m => ({
        template_id: template.id,
        material_name: m.name,
        quantity: m.quantity,
        unit: m.unit
      }));

      const { error: materialsError } = await supabase
        .from('template_materials')
        .insert(templateMaterials);

      if (materialsError) throw materialsError;

      toast({ title: 'Success', description: 'Template saved successfully' });
      onSuccess?.();
      onOpenChange(false);
      setName('');
      setDescription('');
      setCategory('custom');
      setIsPublic(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>Create a reusable template from this estimate</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Template Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Custom Kitchen Remodel" />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="framing">Framing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="concrete">Concrete</SelectItem>
                <SelectItem value="drywall">Drywall</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..." rows={2} />
          </div>

          <div className="flex items-center justify-between">
            <Label>Make Public</Label>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <div>
            <Label className="mb-2 block">Materials (adjust quantities if needed)</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-2">
              {editedMaterials.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm">{m.name}</span>
                  <Input type="number" value={m.quantity} onChange={(e) => updateQuantity(i, parseFloat(e.target.value))} className="w-20" />
                  <span className="text-sm text-muted-foreground w-12">{m.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={saveTemplate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Template
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
