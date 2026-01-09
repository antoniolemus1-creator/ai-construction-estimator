import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Revision {
  id: string;
  revisionNumber: number;
  revisionName: string;
  file: File;
  preview?: string;
}

interface PlanRevisionUploaderProps {
  planId: string;
  onRevisionsUploaded: (revisions: any[]) => void;
}

export function PlanRevisionUploader({ planId, onRevisionsUploaded }: PlanRevisionUploaderProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newRevisions = files.map((file, idx) => ({
      id: Math.random().toString(36).substr(2, 9),
      revisionNumber: revisions.length + idx + 1,
      revisionName: `Revision ${revisions.length + idx + 1}`,
      file
    }));
    setRevisions([...revisions, ...newRevisions]);
  };

  const removeRevision = (id: string) => {
    setRevisions(revisions.filter(r => r.id !== id));
  };

  const uploadRevisions = async () => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadedRevisions = [];

      for (const revision of revisions) {
        const filePath = `${user.id}/${planId}/revision-${revision.revisionNumber}-${Date.now()}.pdf`;
        
        // Upload to storage
        console.log('Uploading file to storage:', filePath);
        const { error: uploadError } = await supabase.storage
          .from('construction-plans')
          .upload(filePath, revision.file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Insert into database
        console.log('Inserting revision into database');
        const { data: revisionData, error: dbError } = await supabase
          .from('plan_revisions')
          .insert({
            plan_id: planId,
            user_id: user.id,
            version_number: revision.revisionNumber,
            file_url: filePath,
            file_name: revision.file.name,
            status: 'uploaded'
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw new Error(`Failed to save revision: ${dbError.message}`);
        }
        
        uploadedRevisions.push(revisionData);
      }

      toast.success('Revisions uploaded successfully');
      onRevisionsUploaded(uploadedRevisions);
      setRevisions([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload revisions');
    } finally {
      setUploading(false);
    }
  };


  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Plan Revisions</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="revision-files">Select PDF Files</Label>
          <Input
            id="revision-files"
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="mt-2"
          />
        </div>

        {revisions.length > 0 && (
          <div className="space-y-2">
            {revisions.map((rev) => (
              <div key={rev.id} className="flex items-center justify-between p-3 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <div>
                    <p className="font-medium">{rev.revisionName}</p>
                    <p className="text-sm text-muted-foreground">{rev.file.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeRevision(rev.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button onClick={uploadRevisions} disabled={revisions.length === 0 || uploading} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : `Upload ${revisions.length} Revision(s)`}
        </Button>
      </div>
    </Card>
  );
}