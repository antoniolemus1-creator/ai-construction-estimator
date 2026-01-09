import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { FileText, Ruler, BookOpen } from 'lucide-react';

interface DocumentTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: ExtractionConfig) => void;
}

export interface ExtractionConfig {
  documentType: 'plans' | 'specs' | 'both';
  scale?: string;
  specDivisions?: string[];
  specExtractions?: string[];
  crossReference?: boolean;
}

const CSI_DIVISIONS = [
  '01 - General Requirements',
  '02 - Existing Conditions',
  '03 - Concrete',
  '04 - Masonry',
  '05 - Metals',
  '06 - Wood, Plastics, Composites',
  '07 - Thermal and Moisture Protection',
  '08 - Openings',
  '09 - Finishes',
  '10 - Specialties',
  '11 - Equipment',
  '12 - Furnishings',
  '13 - Special Construction',
  '14 - Conveying Equipment',
];

const SPEC_EXTRACTIONS = [
  'Materials and Products',
  'Installation Methods',
  'Quality Standards',
  'Contract Requirements',
  'Submittal Requirements',
  'Testing Procedures',
];

export function DocumentTypeSelector({ open, onClose, onConfirm }: DocumentTypeSelectorProps) {
  const [docType, setDocType] = useState<'plans' | 'specs' | 'both'>('plans');
  const [scale, setScale] = useState('');
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([]);
  const [selectedExtractions, setSelectedExtractions] = useState<string[]>([]);

  const handleConfirm = () => {
    onConfirm({
      documentType: docType,
      scale: docType !== 'specs' ? scale : undefined,
      specDivisions: docType !== 'plans' ? selectedDivisions : undefined,
      specExtractions: docType !== 'plans' ? selectedExtractions : undefined,
      crossReference: docType === 'both',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Document Extraction</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold">Document Type</Label>
            <RadioGroup value={docType} onValueChange={(v: any) => setDocType(v)} className="mt-3">
              <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setDocType('plans')}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="plans" id="plans" />
                  <div className="flex-1">
                    <Label htmlFor="plans" className="cursor-pointer font-semibold flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Construction Plans Only
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Extract takeoff data from drawings</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setDocType('specs')}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="specs" id="specs" />
                  <div className="flex-1">
                    <Label htmlFor="specs" className="cursor-pointer font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Specifications Only
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Extract materials, methods, and requirements</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setDocType('both')}>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="both" id="both" />
                  <div className="flex-1">
                    <Label htmlFor="both" className="cursor-pointer font-semibold flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Both Plans & Specifications
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">Extract and cross-reference both document types</p>
                  </div>
                </div>
              </Card>
            </RadioGroup>
          </div>

          {(docType === 'plans' || docType === 'both') && (
            <Card className="p-4 bg-blue-50">
              <Label className="font-semibold">Drawing Scale</Label>
              <Input
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                placeholder='e.g., 1/4" = 1 foot 0 inches'

                className="mt-2"
              />
              <p className="text-xs text-gray-600 mt-1">Enter the scale shown on the drawings</p>
            </Card>
          )}

          {(docType === 'specs' || docType === 'both') && (
            <>
              <div>
                <Label className="font-semibold">Select CSI Divisions</Label>
                <div className="grid grid-cols-2 gap-2 mt-3 max-h-48 overflow-y-auto">
                  {CSI_DIVISIONS.map((div) => (
                    <div key={div} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDivisions.includes(div)}
                        onCheckedChange={(checked) => {
                          setSelectedDivisions(prev =>
                            checked ? [...prev, div] : prev.filter(d => d !== div)
                          );
                        }}
                        id={div}
                      />
                      <Label htmlFor={div} className="text-sm cursor-pointer">{div}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-semibold">What to Extract from Specifications</Label>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {SPEC_EXTRACTIONS.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedExtractions.includes(item)}
                        onCheckedChange={(checked) => {
                          setSelectedExtractions(prev =>
                            checked ? [...prev, item] : prev.filter(e => e !== item)
                          );
                        }}
                        id={item}
                      />
                      <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm}>Start Extraction</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
