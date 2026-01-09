import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function DatasetUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const filePath = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('training-datasets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: processData } = await supabase.functions.invoke('process-csv-upload', {
        body: { fileName: file.name, fileSize: file.size, filePath }
      });

      const { error: dbError } = await supabase.from('datasets').insert({
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        row_count: processData?.validation?.rowCount || 0,
        status: 'processed'
      });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Dataset uploaded successfully' });
      onUploadComplete();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Training Data</CardTitle>
      </CardHeader>
      <CardContent>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> CSV file
            </p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </CardContent>
    </Card>
  );
}
