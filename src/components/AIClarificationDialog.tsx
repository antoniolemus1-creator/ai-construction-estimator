import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  question_context: string;
  question_type: string;
  missing_field: string;
}

interface AIClarificationDialogProps {
  planUploadId: string;
  open: boolean;
  onClose: () => void;
  onAnswersSubmitted: () => void;
}

export function AIClarificationDialog({ planUploadId, open, onClose, onAnswersSubmitted }: AIClarificationDialogProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && planUploadId) {
      loadQuestions();
    }
  }, [open, planUploadId]);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from('ai_clarification_questions')
      .select('*')
      .eq('plan_upload_id', planUploadId)
      .is('answer_text', null)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Error loading questions', description: error.message, variant: 'destructive' });
    } else {
      setQuestions(data || []);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const updates = Object.entries(answers).map(([questionId, answer]) => ({
        id: questionId,
        answer_text: answer,
        answered_at: new Date().toISOString(),
        used_for_training: true,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('ai_clarification_questions')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({ title: 'Answers submitted', description: 'Thank you for providing clarification.' });
      onAnswersSubmitted();
      onClose();
    } catch (error: any) {
      toast({ title: 'Error submitting answers', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      missing_dimension: 'Missing Dimension',
      unclear_specification: 'Unclear Specification',
      missing_material: 'Missing Material',
      scale_clarification: 'Scale Clarification',
      wall_type: 'Wall Type',
      deck_height: 'Deck Height',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            AI Needs Clarification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            The AI has identified some missing or unclear information in your drawings. 
            Please provide answers to help complete the extraction. Your responses will 
            be used to improve AI accuracy for future projects.
          </p>

          {questions.map((question, index) => (
            <Card key={question.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded">
                      {getQuestionTypeLabel(question.question_type)}
                    </span>
                    <span className="text-xs text-gray-500">Question {index + 1}</span>
                  </div>
                  <p className="font-medium mb-1">{question.question_text}</p>
                  {question.question_context && (
                    <p className="text-sm text-gray-600 mb-2">Context: {question.question_context}</p>
                  )}
                </div>
              </div>
              <Textarea
                placeholder="Enter your answer here..."
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                rows={3}
              />
            </Card>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting || Object.keys(answers).length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Answers'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}