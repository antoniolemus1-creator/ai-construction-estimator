import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Share2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Material {
  id: string;
  material_name: string;
  description: string;
  quantity: number;
  unit: string;
  category: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  is_system_template: boolean;
  usage_count: number;
}

export function TemplateDetailsModal({ 
  template, 
  onClose, 
  onUse 
}: { 
  template: Template; 
  onClose: () => void; 
  onUse: () => void;
}) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMaterials();
  }, [template.id]);

  const loadMaterials = async () => {
    const { data } = await supabase
      .from('template_materials')
      .select('*')
      .eq('template_id', template.id)
      .order('sort_order');

    if (data) setMaterials(data);
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) {
      toast({ title: 'Error', description: 'Enter an email address', variant: 'destructive' });
      return;
    }

    setSharing(true);
    const { data: targetUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', shareEmail)
      .single();

    if (!targetUser) {
      toast({ title: 'Error', description: 'User not found', variant: 'destructive' });
      setSharing(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('template_shares')
      .insert({
        template_id: template.id,
        shared_by: user?.id,
        shared_with: targetUser.id,
        can_edit: false
      });

    setSharing(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to share template', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Template shared successfully' });
      setShareEmail('');
    }
  };

  const handleDuplicate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: newTemplate, error: templateError } = await supabase
      .from('project_templates')
      .insert({
        user_id: user?.id,
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        is_public: false
      })
      .select()
      .single();

    if (templateError || !newTemplate) {
      toast({ title: 'Error', description: 'Failed to duplicate', variant: 'destructive' });
      return;
    }

    const materialsToInsert = materials.map(m => ({
      template_id: newTemplate.id,
      material_name: m.material_name,
      description: m.description,
      quantity: m.quantity,
      unit: m.unit,
      category: m.category
    }));

    await supabase.from('template_materials').insert(materialsToInsert);
    toast({ title: 'Success', description: 'Template duplicated' });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge>{template.category}</Badge>
              {template.is_system_template && <Badge variant="secondary">System</Badge>}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Materials ({materials.length})</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map(material => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.material_name}</TableCell>
                      <TableCell>{material.description}</TableCell>
                      <TableCell>{material.quantity}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.category}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {!template.is_system_template && (
            <div>
              <h3 className="font-semibold mb-2">Share Template</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email address"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
                <Button onClick={handleShare} disabled={sharing}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button onClick={onUse}>Use This Template</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
