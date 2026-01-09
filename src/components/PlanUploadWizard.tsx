import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface PlanUploadWizardProps {
  onUploadComplete: (uploadId: string) => void;
}

export function PlanUploadWizard({ onUploadComplete }: PlanUploadWizardProps) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [documentType, setDocumentType] = useState<'drawings' | 'specifications' | 'both'>('drawings');
  const [hasSpecs, setHasSpecs] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStep(2);
    }
  };

  const handlePageSelection = (page: number) => {
    setSelectedPages(prev => 
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('construction-plans')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('construction-plans')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('plans')
        .insert({
          user_id: user.id,
          project_name: projectName,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          total_pages: totalPages || null,
          document_type: documentType,
          has_specifications: hasSpecs,
          selected_pages: selectedPages.length > 0 ? selectedPages : null,
        })
        .select()
        .single();

      if (error) throw error;


      if (error) throw error;

      toast({ title: 'Upload successful', description: 'Your plans have been uploaded.' });
      onUploadComplete(data.id);
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upload Construction Documents</h3>
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">Choose file</span>
              <Input id="file-upload" type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
            </Label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Document Information</h3>
          <div>
            <Label>Project Name</Label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter project name" />
          </div>
          <div>
            <Label>Document Type</Label>
            <RadioGroup value={documentType} onValueChange={(v: any) => setDocumentType(v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="drawings" id="drawings" />
                <Label htmlFor="drawings">Drawings Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specifications" id="specifications" />
                <Label htmlFor="specifications">Specifications Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both">Both Drawings & Specifications</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox checked={hasSpecs} onCheckedChange={(c) => setHasSpecs(c as boolean)} id="has-specs" />
            <Label htmlFor="has-specs">This document contains material specifications</Label>
          </div>
          <div>
            <Label>Total Pages (optional)</Label>
            <Input type="number" value={totalPages || ''} onChange={(e) => setTotalPages(parseInt(e.target.value) || 0)} />
          </div>
          <Button onClick={() => setStep(3)}>Next</Button>
        </div>
      )}

      {step === 3 && totalPages > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Pages to Extract</h3>
          <Button onClick={selectAllPages} variant="outline" size="sm">Select All</Button>
          <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={selectedPages.includes(page) ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageSelection(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline">Back</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Extract'}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && totalPages === 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Ready to upload. Click below to proceed.</p>
          <div className="flex gap-2">
            <Button onClick={() => setStep(2)} variant="outline">Back</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Extract'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}