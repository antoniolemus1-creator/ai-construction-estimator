import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FileText, Ruler, Layers } from 'lucide-react';

interface DocumentTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (type: 'drawings' | 'specifications' | 'both') => void;
  fileName: string;
}

export function DocumentTypeDialog({ open, onClose, onConfirm, fileName }: DocumentTypeDialogProps) {
  const [docType, setDocType] = useState<'drawings' | 'specifications' | 'both'>('drawings');

  const handleConfirm = () => {
    onConfirm(docType);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Specify Document Type</DialogTitle>
          <DialogDescription>
            What type of construction document is "{fileName}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={docType} onValueChange={(v: any) => setDocType(v)}>
            <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="drawings" id="drawings" />
              <div className="flex-1">
                <Label htmlFor="drawings" className="cursor-pointer flex items-center gap-2 font-medium">
                  <Ruler className="w-4 h-4" />
                  Construction Drawings
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Floor plans, elevations, sections with dimensions and room layouts
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="specifications" id="specifications" />
              <div className="flex-1">
                <Label htmlFor="specifications" className="cursor-pointer flex items-center gap-2 font-medium">
                  <FileText className="w-4 h-4" />
                  Specifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  CSI division specs, material requirements, standards
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="both" id="both" />
              <div className="flex-1">
                <Label htmlFor="both" className="cursor-pointer flex items-center gap-2 font-medium">
                  <Layers className="w-4 h-4" />
                  Both Drawings & Specifications
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Combined document with drawings and spec sheets
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
