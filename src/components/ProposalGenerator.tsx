import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Copy, Download, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


interface Material {
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface ProposalGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  materials: Material[];
  subtotal: number;
  taxAmount: number;
  markupAmount: number;
  total: number;
  state?: string;
  county?: string;
}

export function ProposalGenerator({

  open, onOpenChange, projectName, materials, subtotal, taxAmount, markupAmount, total, state, county
}: ProposalGeneratorProps) {
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(false);
  const [organizedMaterials, setOrganizedMaterials] = useState<any[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublicTemplate, setIsPublicTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();


  const generateProposal = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: { projectName, materials, subtotal, taxAmount, markupAmount, total, state, county }
      });

      if (error) throw error;
      setProposal(data.proposal);
      setOrganizedMaterials(data.organizedMaterials || []);
      toast({ title: 'Success', description: 'Proposal generated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(proposal);
    toast({ title: 'Copied', description: 'Proposal copied to clipboard' });
  };

  const downloadProposal = () => {
    const blob = new Blob([proposal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_proposal.txt`;
    a.click();
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Parse proposal to extract sections
      const sections = parseProposalSections(proposal);

      // Create template
      const { data: template, error: templateError } = await supabase
        .from('proposal_templates')
        .insert({
          user_id: user.id,
          name: templateName,
          description: templateDescription,
          category: 'Construction',
          is_public: isPublicTemplate,
          company_name: projectName
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Create sections
      const sectionsToInsert = sections.map((s, i) => ({
        template_id: template.id,
        section_type: s.type,
        title: s.title,
        content: s.content,
        order_index: i,
        is_required: false
      }));

      const { error: sectionsError } = await supabase
        .from('proposal_template_sections')
        .insert(sectionsToInsert);

      if (sectionsError) throw sectionsError;

      // Create initial version
      await supabase.from('proposal_versions').insert({
        template_id: template.id,
        version_number: 1,
        sections: sections,
        created_by: user.id,
        notes: 'Initial version from AI-generated proposal'
      });

      toast({ title: 'Success', description: 'Proposal saved as template' });
      setShowSaveTemplate(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const parseProposalSections = (text: string) => {
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { type: 'custom', title: '', content: '' };
    
    for (const line of lines) {
      if (line.startsWith('##')) {
        if (currentSection.title) sections.push(currentSection);
        const title = line.replace('##', '').trim();
        currentSection = { 
          type: title.toLowerCase().replace(/\s+/g, '_'), 
          title, 
          content: '' 
        };
      } else if (line.trim()) {
        currentSection.content += line + '\n';
      }
    }
    if (currentSection.title) sections.push(currentSection);
    return sections;
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-Generated Proposal</DialogTitle>
          <DialogDescription>Generate a professional proposal organized by NAICS industry codes</DialogDescription>
        </DialogHeader>

        {!proposal ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Materials by Industry (NAICS)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Your materials will be automatically organized by construction industry codes for a professional breakdown.
              </CardContent>
            </Card>
            <Button onClick={generateProposal} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Generate Proposal
            </Button>
          </div>
        ) : showSaveTemplate ? (
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input 
                value={templateName} 
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Commercial Construction Proposal"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={templateDescription} 
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe this template..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublicTemplate} onCheckedChange={setIsPublicTemplate} />
              <Label>Share with team members</Label>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
                Back
              </Button>
              <Button onClick={saveAsTemplate} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Template
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea value={proposal} onChange={(e) => setProposal(e.target.value)} rows={20} className="font-mono text-sm" />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button onClick={downloadProposal} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={() => setShowSaveTemplate(true)} variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save as Template
              </Button>
              <Button onClick={generateProposal} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Regenerate
              </Button>
            </div>
          </div>

        )}
      </DialogContent>
    </Dialog>
  );
}
