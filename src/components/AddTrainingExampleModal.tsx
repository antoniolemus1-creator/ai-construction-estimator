import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTrainingExampleModal({ onClose, onSuccess }: Props) {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try to analyze quality, but use fallback if it fails
      let quality_score = 0.7;
      let quality_factors = { clarity: 0.7, completeness: 0.7, consistency: 0.7 };

      try {
        const qualityResponse = await supabase.functions.invoke('analyze-training-data-quality', {
          body: {
            trainingData: { input_text: inputText, expected_output: outputText },
            operation: 'analyze_quality'
          }
        });

        if (!qualityResponse.error && qualityResponse.data?.metrics) {
          quality_score = qualityResponse.data.metrics.quality_score;
          quality_factors = qualityResponse.data.metrics.quality_factors;
        }
      } catch (qualityError) {
        console.warn('Quality analysis failed, using default score:', qualityError);
      }

      // Insert training example
      const { error } = await supabase
        .from('training_data_curation')
        .insert({
          source_type: 'manual',
          input_text: inputText,
          expected_output: outputText,
          document_type: documentType,
          difficulty_level: difficulty,
          extraction_category: category,
          quality_score,
          quality_factors,
          status: 'approved'
        });

      if (error) throw error;

      toast.success('Training example added successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error('Failed to add training example');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Training Example</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Input Text</Label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter the input prompt or question..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Expected Output</Label>
            <Textarea
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              placeholder="Enter the expected AI response..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Document Type</Label>
              <Input
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="e.g., Blueprint, Spec"
              />
            </div>

            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Materials"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Example'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}