import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (projectName: string) => void;
  suggestedName?: string;
}

export function CreateProjectModal({ open, onClose, onConfirm, suggestedName }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState(suggestedName || '');
  const [generating, setGenerating] = useState(false);

  const handleConfirm = () => {
    if (projectName.trim()) {
      onConfirm(projectName.trim());
      setProjectName('');
      onClose();
    }
  };

  const handleAISuggest = async () => {
    setGenerating(true);
    // Simulate AI generation - in production, this would call an AI service
    setTimeout(() => {
      const suggestions = [
        'Commercial Office Building - Phase 1',
        'Residential Complex - Tower A',
        'Industrial Warehouse Expansion',
        'Retail Center Renovation',
        'Healthcare Facility Addition'
      ];
      setProjectName(suggestions[Math.floor(Math.random() * suggestions.length)]);
      setGenerating(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a project name or let AI suggest one based on your files.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Downtown Office Building"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirm();
                }
              }}
            />
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAISuggest}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Suggest Project Name
          </Button>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!projectName.trim()}>
            Create Project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
