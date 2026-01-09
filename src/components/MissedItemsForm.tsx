import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';

interface MissedItemsFormProps {
  planId: string;
  onSubmit: () => void;
}

export function MissedItemsForm({ planId, onSubmit }: MissedItemsFormProps) {
  const [itemType, setItemType] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const missedItemData = {
      item_type: itemType,
      description,
      quantity: parseFloat(quantity),
      unit,
      location: 'User reported'
    };

    const { error } = await supabase.from('extraction_feedback').insert({
      user_id: user.id,
      plan_id: planId,
      feedback_type: 'missed',
      corrected_data: missedItemData,
      notes
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Missed item reported' });
      setItemType(''); setDescription(''); setQuantity(''); setUnit(''); setNotes('');
      onSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Report Missed Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Item Type</Label>
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wall">Wall</SelectItem>
                <SelectItem value="door">Door</SelectItem>
                <SelectItem value="window">Window</SelectItem>
                <SelectItem value="fixture">Fixture</SelectItem>
                <SelectItem value="dimension">Dimension</SelectItem>
                <SelectItem value="annotation">Annotation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the missed item" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quantity</Label>
              <Input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div>
              <Label>Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="ft, ea, sf" required />
            </div>
          </div>
          
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional context..." />
          </div>
          
          <Button type="submit" className="w-full">Submit Missed Item</Button>
        </form>
      </CardContent>
    </Card>
  );
}
