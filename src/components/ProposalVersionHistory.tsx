import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Version {
  id: string;
  version_number: number;
  sections: any;
  metadata: any;
  created_at: string;
  notes: string;
}

interface Props {
  templateId: string;
  onClose: () => void;
}

export function ProposalVersionHistory({ templateId, onClose }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [templateId]);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('proposal_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      toast.error('Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (version: Version) => {
    if (!confirm(`Restore version ${version.version_number}?`)) return;

    try {
      const { data: template } = await supabase
        .from('proposal_templates')
        .select('version')
        .eq('id', templateId)
        .single();

      if (!template) throw new Error('Template not found');

      // Create new version from current state
      await supabase.from('proposal_versions').insert({
        template_id: templateId,
        version_number: template.version,
        sections: version.sections,
        notes: `Restored from version ${version.version_number}`
      });

      // Delete existing sections
      await supabase
        .from('proposal_template_sections')
        .delete()
        .eq('template_id', templateId);

      // Restore sections from version
      const sectionsToRestore = version.sections.map((s: any) => ({
        template_id: templateId,
        section_type: s.section_type,
        title: s.title,
        content: s.content,
        order_index: s.order_index,
        is_required: s.is_required
      }));

      await supabase
        .from('proposal_template_sections')
        .insert(sectionsToRestore);

      // Update template version
      await supabase
        .from('proposal_templates')
        .update({ 
          version: template.version + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      toast.success('Version restored');
      loadVersions();
    } catch (error) {
      toast.error('Failed to restore version');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading versions...</p>
          ) : versions.length === 0 ? (
            <p className="text-center text-muted-foreground">No version history available</p>
          ) : (
            versions.map((version) => (
              <Card key={version.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Version {version.version_number}
                      </CardTitle>
                      <CardDescription>
                        {new Date(version.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => restoreVersion(version)}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {version.notes && (
                    <p className="text-sm text-muted-foreground mb-2">{version.notes}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {version.sections?.map((section: any, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {section.title}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}