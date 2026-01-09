import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Edit, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ExtractionFeedbackCardProps {
  item: any;
  planId: string;
  onFeedbackSubmit: () => void;
}

export function ExtractionFeedbackCard({ item, planId, onFeedbackSubmit }: ExtractionFeedbackCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [editedData, setEditedData] = useState(item);
  const { toast } = useToast();

  const submitFeedback = async (type: string, correctedData?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('extraction_feedback').insert({
      user_id: user.id,
      plan_id: planId,
      takeoff_item_id: item.id,
      feedback_type: type,
      original_data: item,
      corrected_data: correctedData,
      notes
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Feedback submitted' });
      onFeedbackSubmit();
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold">{item.item_type}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
        <Badge>{item.confidence_score}% confidence</Badge>
      </div>
      
      {isEditing ? (
        <div className="space-y-2 mb-3">
          <input value={editedData.quantity} onChange={(e) => setEditedData({...editedData, quantity: e.target.value})} className="w-full p-2 border rounded" />
          <input value={editedData.unit} onChange={(e) => setEditedData({...editedData, unit: e.target.value})} className="w-full p-2 border rounded" />
        </div>
      ) : (
        <p className="text-sm mb-3">Quantity: {item.quantity} {item.unit}</p>
      )}
      
      <Textarea placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="mb-3" />
      
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => submitFeedback('correct')}><CheckCircle className="w-4 h-4 mr-1" />Correct</Button>
        <Button size="sm" variant="outline" onClick={() => submitFeedback('incorrect')}><XCircle className="w-4 h-4 mr-1" />Incorrect</Button>
        {isEditing ? (
          <Button size="sm" onClick={() => { submitFeedback('modified', editedData); setIsEditing(false); }}><Save className="w-4 h-4 mr-1" />Save</Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-1" />Edit</Button>
        )}
      </div>
    </Card>
  );
}
