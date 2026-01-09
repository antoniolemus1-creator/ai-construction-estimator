import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MultiFileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (files: File[]) => void;
  projectName: string;
}

export function MultiFileUploadDialog({ open, onClose, onConfirm, projectName }: MultiFileUploadDialogProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (files.length > 0) {
      onConfirm(files);
      setFiles([]);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files to: {projectName}</DialogTitle>
          <DialogDescription>
            Upload multiple construction plans and/or specifications for this project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <label className="block">
            <Button variant="outline" className="w-full" asChild>
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Select Files (PDF)
              </span>
            </Button>
            <input 
              type="file" 
              accept=".pdf" 
              multiple 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>

          {files.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-between items-center">
          <Badge variant="secondary">{files.length} file(s) selected</Badge>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={files.length === 0}>
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
