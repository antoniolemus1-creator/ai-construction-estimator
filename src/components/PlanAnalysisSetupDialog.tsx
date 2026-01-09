import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Ruler, FileText, AlertCircle } from 'lucide-react';

interface PlanAnalysisSetupDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (config: AnalysisConfig) => void;
  isDrawing?: boolean;
}

export interface AnalysisConfig {
  // Drawing-specific
  drawingScale?: string;
  takeoffItems?: string[];
  missingInfo?: string;
  
  // Specs-specific
  specDivisions?: string[];
}


const commonTakeoffItems = [
  'Wall lengths and heights',
  'Ceiling areas',
  'Door and window counts',
  'Floor areas',
  'Electrical fixtures',
  'Plumbing fixtures',
  'HVAC equipment',
  'Structural elements'
];

const specDivisions = [
  'Division 01 - General Requirements',
  'Division 03 - Concrete',
  'Division 04 - Masonry',
  'Division 05 - Metals',
  'Division 06 - Wood/Plastics',
  'Division 07 - Thermal/Moisture',
  'Division 08 - Openings',
  'Division 09 - Finishes',
  'Division 21 - Fire Suppression',
  'Division 22 - Plumbing',
  'Division 23 - HVAC',
  'Division 26 - Electrical',
  'Division 27 - Communications',
  'Division 28 - Electronic Safety'
];

export function PlanAnalysisSetupDialog({ open, onClose, onSubmit, isDrawing = true }: PlanAnalysisSetupDialogProps) {
  const [scale, setScale] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState('');
  const [missingInfo, setMissingInfo] = useState('');
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);

  const handleSubmit = () => {
    if (isDrawing) {
      const config: AnalysisConfig = {
        drawingScale: scale,
        takeoffItems: [...selectedItems, ...customItems.split(',').map(i => i.trim()).filter(Boolean)],
        missingInfo,
      };
      onSubmit(config);
    } else {
      const config: AnalysisConfig = {
        specDivisions: selectedDivisions,
      };
      onSubmit(config);
    }
    onClose();
  };


  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleDivision = (div: string) => {
    setSelectedDivisions(prev => 
      prev.includes(div) ? prev.filter(d => d !== div) : [...prev, div]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDrawing ? <Ruler className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            {isDrawing ? 'Drawing Analysis Setup' : 'Specifications Analysis Setup'}
          </DialogTitle>
          <DialogDescription>
            {isDrawing 
              ? 'Provide information to help AI accurately measure and extract data from your construction drawings.'
              : 'Specify which sections of the specifications AI should analyze to avoid processing irrelevant content.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isDrawing ? (
            <>
              <div>
                <Label htmlFor="scale">Drawing Scale *</Label>
                <Input
                  id="scale"
                  placeholder='e.g., 1/4" = 1ft-0in, 1:100, etc.'
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the scale shown on the drawing for accurate measurements
                </p>
              </div>

              <div>
                <Label>Takeoff Items Needed *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {commonTakeoffItems.map(item => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={selectedItems.includes(item)}
                        onCheckedChange={() => toggleItem(item)}
                      />
                      <label htmlFor={item} className="text-sm cursor-pointer">
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="custom">Additional Custom Items</Label>
                <Input
                  id="custom"
                  placeholder="e.g., Rebar quantities, Paint areas (comma-separated)"
                  value={customItems}
                  onChange={(e) => setCustomItems(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="missing">Missing Information or Notes</Label>
                <Textarea
                  id="missing"
                  placeholder="Describe any missing details, assumptions to make, or special instructions..."
                  value={missingInfo}
                  onChange={(e) => setMissingInfo(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Tell AI about incomplete details, standard assumptions, or specific requirements
                </p>
              </div>
            </>
          ) : (
            <div>
              <Label>CSI Divisions to Analyze *</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Select one or more divisions that AI should focus on. Only selected divisions will be analyzed.
              </p>
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-96 overflow-y-auto border rounded p-3">
                {specDivisions.map(div => (
                  <div key={div} className="flex items-center space-x-2">
                    <Checkbox
                      id={div}
                      checked={selectedDivisions.includes(div)}
                      onCheckedChange={() => toggleDivision(div)}
                    />
                    <label htmlFor={div} className="text-sm cursor-pointer">
                      {div}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit}
            disabled={isDrawing ? (!scale && selectedItems.length === 0) : selectedDivisions.length === 0}
          >
            Start Analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
