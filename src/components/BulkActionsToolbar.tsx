import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Trash2, Type, Percent, TrendingUp, Tag } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkUpdateUnit: (unit: string) => void;
  onBulkAdjustConfidence: (percentage: number) => void;
  onBulkApplyMarkup: (percentage: number) => void;
  onBulkChangeType: (type: string) => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onBulkDelete,
  onBulkUpdateUnit,
  onBulkAdjustConfidence,
  onBulkApplyMarkup,
  onBulkChangeType,
  onClearSelection
}: BulkActionsToolbarProps) {
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [showConfidenceDialog, setShowConfidenceDialog] = useState(false);
  const [showMarkupDialog, setShowMarkupDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  
  const [unitValue, setUnitValue] = useState('');
  const [confidenceValue, setConfidenceValue] = useState('');
  const [markupValue, setMarkupValue] = useState('');
  const [typeValue, setTypeValue] = useState('wall');

  const handleUnitSubmit = () => {
    if (unitValue.trim()) {
      onBulkUpdateUnit(unitValue.trim());
      setShowUnitDialog(false);
      setUnitValue('');
    }
  };

  const handleConfidenceSubmit = () => {
    const val = parseFloat(confidenceValue);
    if (!isNaN(val)) {
      onBulkAdjustConfidence(val);
      setShowConfidenceDialog(false);
      setConfidenceValue('');
    }
  };

  const handleMarkupSubmit = () => {
    const val = parseFloat(markupValue);
    if (!isNaN(val)) {
      onBulkApplyMarkup(val);
      setShowMarkupDialog(false);
      setMarkupValue('');
    }
  };

  const handleTypeSubmit = () => {
    onBulkChangeType(typeValue);
    setShowTypeDialog(false);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
        <span className="font-semibold">{selectedCount} items selected</span>
        
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowTypeDialog(true)}>
            <Tag className="w-4 h-4 mr-2" />
            Change Type
          </Button>
          
          <Button size="sm" variant="secondary" onClick={() => setShowUnitDialog(true)}>
            <Type className="w-4 h-4 mr-2" />
            Update Unit
          </Button>
          
          <Button size="sm" variant="secondary" onClick={() => setShowConfidenceDialog(true)}>
            <Percent className="w-4 h-4 mr-2" />
            Adjust Confidence
          </Button>
          
          <Button size="sm" variant="secondary" onClick={() => setShowMarkupDialog(true)}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Apply Markup
          </Button>
          
          <Button size="sm" variant="destructive" onClick={onBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
        
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Clear
        </Button>
      </div>

      {/* Type Dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Item Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>New Item Type</Label>
            <select
              className="w-full border rounded px-3 py-2 mt-2"
              value={typeValue}
              onChange={(e) => setTypeValue(e.target.value)}
            >
              <option value="wall">Wall</option>
              <option value="ceiling">Ceiling</option>
              <option value="door">Door</option>
              <option value="window">Window</option>
              <option value="other">Other</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Cancel</Button>
            <Button onClick={handleTypeSubmit}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Unit Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>New Unit (e.g., LF, SF, EA)</Label>
            <Input
              value={unitValue}
              onChange={(e) => setUnitValue(e.target.value)}
              placeholder="LF"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnitDialog(false)}>Cancel</Button>
            <Button onClick={handleUnitSubmit}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confidence Dialog */}
      <Dialog open={showConfidenceDialog} onOpenChange={setShowConfidenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Confidence Scores</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Adjustment Percentage (e.g., +10 or -15)</Label>
            <Input
              type="number"
              value={confidenceValue}
              onChange={(e) => setConfidenceValue(e.target.value)}
              placeholder="10"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Positive values increase confidence, negative values decrease it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfidenceDialog(false)}>Cancel</Button>
            <Button onClick={handleConfidenceSubmit}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Markup Dialog */}
      <Dialog open={showMarkupDialog} onOpenChange={setShowMarkupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Markup to Quantities</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>Markup Percentage (e.g., 10 for +10%)</Label>
            <Input
              type="number"
              value={markupValue}
              onChange={(e) => setMarkupValue(e.target.value)}
              placeholder="10"
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Applies a percentage increase to all selected quantities.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkupDialog(false)}>Cancel</Button>
            <Button onClick={handleMarkupSubmit}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
