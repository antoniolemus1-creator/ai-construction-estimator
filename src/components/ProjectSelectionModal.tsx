import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderPlus, FolderOpen } from 'lucide-react';

interface ProjectSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onExistingProject: () => void;
}

export function ProjectSelectionModal({ 
  open, 
  onClose, 
  onNewProject, 
  onExistingProject 
}: ProjectSelectionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Would you like to start a new project or add to an existing one?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={onNewProject}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <FolderPlus className="w-8 h-8" />
            <div className="text-center">
              <div className="font-semibold">New Project</div>
              <div className="text-xs text-muted-foreground">Start fresh with new files</div>
            </div>
          </Button>
          <Button
            onClick={onExistingProject}
            className="h-24 flex flex-col items-center justify-center gap-2"
            variant="outline"
          >
            <FolderOpen className="w-8 h-8" />
            <div className="text-center">
              <div className="font-semibold">Use Existing Project</div>
              <div className="text-xs text-muted-foreground">Select from uploaded plans</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
