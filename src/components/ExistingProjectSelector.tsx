import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { FileText, File, Loader2 } from 'lucide-react';

interface ExistingProjectSelectorProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedPlans: any[]) => void;
}

export function ExistingProjectSelector({ open, onClose, onConfirm }: ExistingProjectSelectorProps) {
  const [step, setStep] = useState<'project' | 'type' | 'files'>('project');
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [needType, setNeedType] = useState<'drawings' | 'specs' | 'both'>('both');
  const [availableFiles, setAvailableFiles] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProjects();
    }
  }, [open]);

  const loadProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('plans')
      .select('project_name')
      .order('created_at', { ascending: false });
    
    const uniqueProjects = Array.from(new Set(data?.map(p => p.project_name) || []));
    setProjects(uniqueProjects.map(name => ({ name })));
    setLoading(false);
  };

  const handleProjectNext = () => {
    if (selectedProject) setStep('type');
  };

  const handleTypeNext = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('plans')
      .select('*')
      .eq('project_name', selectedProject);
    
    let filtered = data || [];
    if (needType === 'drawings') {
      filtered = filtered.filter(p => p.document_type === 'drawings' || p.document_type === 'both');
    } else if (needType === 'specs') {
      filtered = filtered.filter(p => p.document_type === 'specifications' || p.document_type === 'both');
    }
    
    setAvailableFiles(filtered);
    setLoading(false);
    setStep('files');
  };

  const toggleFile = (id: string) => {
    const newSet = new Set(selectedFiles);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFiles(newSet);
  };

  const handleConfirm = () => {
    const selected = availableFiles.filter(f => selectedFiles.has(f.id));
    onConfirm(selected);
    onClose();
    setStep('project');
    setSelectedProject('');
    setSelectedFiles(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'project' && 'Select Project'}
            {step === 'type' && 'What do you need?'}
            {step === 'files' && 'Select Files'}
          </DialogTitle>
          <DialogDescription>
            {step === 'project' && 'Choose an existing project'}
            {step === 'type' && 'Select the type of documents you need'}
            {step === 'files' && 'Choose files to work with'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {step === 'project' && (
              <RadioGroup value={selectedProject} onValueChange={setSelectedProject}>
                <ScrollArea className="h-64">
                  {projects.map((project, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                      <RadioGroupItem value={project.name} id={`project-${idx}`} />
                      <Label htmlFor={`project-${idx}`} className="flex-1 cursor-pointer">
                        {project.name}
                      </Label>
                    </div>
                  ))}
                </ScrollArea>
              </RadioGroup>
            )}

            {step === 'type' && (
              <RadioGroup value={needType} onValueChange={(v: any) => setNeedType(v)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="drawings" id="drawings" />
                    <Label htmlFor="drawings" className="flex-1 cursor-pointer">Drawings Only</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="specs" id="specs" />
                    <Label htmlFor="specs" className="flex-1 cursor-pointer">Specifications Only</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="flex-1 cursor-pointer">Both Drawings & Specs</Label>
                  </div>
                </div>
              </RadioGroup>
            )}

            {step === 'files' && (
              <ScrollArea className="h-64">
                {availableFiles.map(file => (
                  <div key={file.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleFile(file.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {file.document_type === 'specifications' ? <File className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        <span className="text-sm font-medium">{file.file_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{file.document_type}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {step === 'project' && (
            <Button onClick={handleProjectNext} disabled={!selectedProject}>Next</Button>
          )}
          {step === 'type' && (
            <Button onClick={handleTypeNext}>Next</Button>
          )}
          {step === 'files' && (
            <Button onClick={handleConfirm} disabled={selectedFiles.size === 0}>
              Confirm ({selectedFiles.size})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
