import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Edit, AlertTriangle, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import AugmentationSuggestions from './AugmentationSuggestions';

interface Props {
  data: any;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onUpdate: () => void;
}

export default function TrainingDataReviewCard({ data, selected, onSelect, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const [inputText, setInputText] = useState(data.input_text);
  const [outputText, setOutputText] = useState(data.expected_output);
  const [showAugmentations, setShowAugmentations] = useState(false);

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('training_data_curation')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) throw error;
      toast.success('Training example approved');
      onUpdate();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('training_data_curation')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) throw error;
      toast.success('Training example rejected');
      onUpdate();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('training_data_curation')
        .update({ 
          input_text: inputText,
          expected_output: outputText,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);

      if (error) throw error;
      toast.success('Changes saved');
      setEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="mt-1"
        />

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={data.is_duplicate ? 'destructive' : 'outline'}>
                  {data.source_type}
                </Badge>
                {data.is_duplicate && (
                  <Badge variant="destructive" className="gap-1">
                    <Copy className="w-3 h-3" />
                    Duplicate
                  </Badge>
                )}
                {data.is_outlier && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Outlier
                  </Badge>
                )}
                {data.difficulty_level && (
                  <Badge variant="secondary">{data.difficulty_level}</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <span className={`font-semibold ${getQualityColor(data.quality_score)}`}>
                  Quality: {(data.quality_score * 100).toFixed(0)}%
                </span>
                {data.quality_factors && (
                  <>
                    <span>Clarity: {(data.quality_factors.clarity * 100).toFixed(0)}%</span>
                    <span>Completeness: {(data.quality_factors.completeness * 100).toFixed(0)}%</span>
                    <span>Consistency: {(data.quality_factors.consistency * 100).toFixed(0)}%</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!editing && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAugmentations(!showAugmentations)}>
                    Augment
                  </Button>
                  {data.status === 'pending' && (
                    <>
                      <Button size="sm" variant="default" onClick={handleApprove}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleReject}>
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </>
              )}
              {editing && (
                <>
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Input:</div>
              {editing ? (
                <Textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="bg-muted p-3 rounded text-sm font-mono">{data.input_text}</div>
              )}
            </div>

            <div>
              <div className="text-sm font-medium mb-1">Expected Output:</div>
              {editing ? (
                <Textarea
                  value={outputText}
                  onChange={(e) => setOutputText(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
              ) : (
                <div className="bg-muted p-3 rounded text-sm font-mono">{data.expected_output}</div>
              )}
            </div>
          </div>

          {data.is_outlier && data.outlier_reason && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
              <span className="font-medium">Outlier Reason:</span> {data.outlier_reason}
            </div>
          )}

          {showAugmentations && (
            <AugmentationSuggestions curationId={data.id} />
          )}
        </div>
      </div>
    </Card>
  );
}