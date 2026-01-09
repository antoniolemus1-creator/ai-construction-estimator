import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Section {
  id?: string;
  section_type: string;
  title: string;
  content: string;
  order_index: number;
  is_required: boolean;
}

interface Props {
  template?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProposalTemplateModal({ template, onClose, onSuccess }: Props) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState(template?.category || 'General');
  const [isPublic, setIsPublic] = useState(template?.is_public || false);
  const [companyName, setCompanyName] = useState(template?.company_name || '');
  const [sections, setSections] = useState<Section[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template?.id) {
      loadSections();
    } else {
      setSections([
        { section_type: 'executive_summary', title: 'Executive Summary', content: '', order_index: 0, is_required: true },
        { section_type: 'scope', title: 'Project Scope', content: '', order_index: 1, is_required: true },
        { section_type: 'terms', title: 'Terms & Conditions', content: '', order_index: 2, is_required: false },
        { section_type: 'payment_schedule', title: 'Payment Schedule', content: '', order_index: 3, is_required: false },
      ]);
    }
  }, [template]);

  const loadSections = async () => {
    const { data } = await supabase
      .from('proposal_template_sections')
      .select('*')
      .eq('template_id', template.id)
      .order('order_index');
    
    if (data) setSections(data);
  };

  const addSection = () => {
    setSections([...sections, {
      section_type: 'custom',
      title: 'New Section',
      content: '',
      order_index: sections.length,
      is_required: false
    }]);
  };

  const updateSection = (index: number, field: keyof Section, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const saveTemplate = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const templateData = {
        name,
        description,
        category,
        is_public: isPublic,
        company_name: companyName,
        updated_at: new Date().toISOString()
      };

      let templateId = template?.id;

      if (template?.id) {
        const { error } = await supabase
          .from('proposal_templates')
          .update({ ...templateData, version: template.version + 1 })
          .eq('id', template.id);
        if (error) throw error;

        await supabase
          .from('proposal_template_sections')
          .delete()
          .eq('template_id', template.id);
      } else {
        const { data, error } = await supabase
          .from('proposal_templates')
          .insert({ ...templateData, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        templateId = data.id;
      }

      const sectionsToInsert = sections.map((s, i) => ({
        template_id: templateId,
        section_type: s.section_type,
        title: s.title,
        content: s.content,
        order_index: i,
        is_required: s.is_required
      }));

      const { error: sectionsError } = await supabase
        .from('proposal_template_sections')
        .insert(sectionsToInsert);

      if (sectionsError) throw sectionsError;

      toast.success(template ? 'Template updated' : 'Template created');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit' : 'Create'} Proposal Template</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Label>Make template public</Label>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            {sections.map((section, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Input
                      value={section.title}
                      onChange={(e) => updateSection(index, 'title', e.target.value)}
                      className="font-semibold"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeSection(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSection(index, 'content', e.target.value)}
                    rows={4}
                    placeholder="Section content..."
                  />
                </div>
              </Card>
            ))}
            <Button onClick={addSection} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={saveTemplate} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}