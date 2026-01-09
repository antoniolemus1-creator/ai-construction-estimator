import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface BulkEditMaterialsModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onSuccess: () => void;
}

export function BulkEditMaterialsModal({ open, onClose, selectedIds, onSuccess }: BulkEditMaterialsModalProps) {
  const [loading, setLoading] = useState(false);
  const [updateFields, setUpdateFields] = useState({
    waste_percentage: '',
    cost_code: '',
    price_adjustment: '',
    adjustment_type: 'percentage',
    is_active: ''
  });

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      toast.error('No materials selected');
      return;
    }

    setLoading(true);
    try {
      const updates: any = {};
      
      if (updateFields.waste_percentage) {
        updates.waste_percentage = parseFloat(updateFields.waste_percentage);
      }
      
      if (updateFields.cost_code) {
        updates.cost_code = updateFields.cost_code;
      }
      
      if (updateFields.is_active) {
        updates.is_active = updateFields.is_active === 'true';
      }

      // Price adjustment
      if (updateFields.price_adjustment) {
        const adjustment = parseFloat(updateFields.price_adjustment);
        
        if (updateFields.adjustment_type === 'percentage') {
          // Fetch current prices and update
          const { data: materials } = await supabase
            .from('construction_materials')
            .select('id, price_per_unit')
            .in('id', selectedIds);

          if (materials) {
            for (const material of materials) {
              const newPrice = material.price_per_unit * (1 + adjustment / 100);
              await supabase
                .from('construction_materials')
                .update({ price_per_unit: newPrice })
                .eq('id', material.id);
            }
          }
        } else {
          updates.price_per_unit = adjustment;
        }
      }

      // Apply other updates
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('construction_materials')
          .update(updates)
          .in('id', selectedIds);

        if (error) throw error;
      }

      toast.success(`Updated ${selectedIds.length} materials`);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Bulk update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedIds.length} Materials</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Waste Percentage</Label>
            <Input
              type="number"
              placeholder="Leave empty to skip"
              value={updateFields.waste_percentage}
              onChange={(e) => setUpdateFields({ ...updateFields, waste_percentage: e.target.value })}
            />
          </div>

          <div>
            <Label>Cost Code</Label>
            <Input
              placeholder="Leave empty to skip"
              value={updateFields.cost_code}
              onChange={(e) => setUpdateFields({ ...updateFields, cost_code: e.target.value })}
            />
          </div>

          <div>
            <Label>Price Adjustment</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount"
                value={updateFields.price_adjustment}
                onChange={(e) => setUpdateFields({ ...updateFields, price_adjustment: e.target.value })}
              />
              <Select
                value={updateFields.adjustment_type}
                onValueChange={(value) => setUpdateFields({ ...updateFields, adjustment_type: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">% Change</SelectItem>
                  <SelectItem value="fixed">Fixed Price</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={updateFields.is_active}
              onValueChange={(value) => setUpdateFields({ ...updateFields, is_active: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Leave unchanged" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBulkUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Update Materials'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
