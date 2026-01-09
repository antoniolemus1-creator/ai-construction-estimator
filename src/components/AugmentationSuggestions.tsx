import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Props {
  curationId: string;
}

export default function AugmentationSuggestions({ curationId }: Props) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [curationId]);

  const loadSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('data_augmentation_suggestions')
        .select('*')
        .eq('curation_id', curationId)
        .eq('status', 'suggested');

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('data_augmentation_suggestions')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (error) throw error;
      toast.success('Augmentation accepted');
      loadSuggestions();
    } catch (error) {
      toast.error('Failed to accept augmentation');
    }
  };

  const handleReject = async (suggestionId: string) => {
    try {
      const { error } = await supabase
        .from('data_augmentation_suggestions')
        .update({ status: 'rejected' })
        .eq('id', suggestionId);

      if (error) throw error;
      toast.success('Augmentation rejected');
      loadSuggestions();
    } catch (error) {
      toast.error('Failed to reject augmentation');
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading suggestions...</div>;
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="w-4 h-4 text-purple-600" />
        Data Augmentation Suggestions
      </div>

      {suggestions.map(suggestion => (
        <Card key={suggestion.id} className="p-4 bg-purple-50 border-purple-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{suggestion.augmentation_type}</Badge>
              <span className="text-sm text-muted-foreground">
                Confidence: {(suggestion.confidence_score * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Original:</div>
                <div className="text-sm bg-white p-2 rounded">{suggestion.original_text}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Augmented:</div>
                <div className="text-sm bg-white p-2 rounded">{suggestion.augmented_text}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleAccept(suggestion.id)}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReject(suggestion.id)}>
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}