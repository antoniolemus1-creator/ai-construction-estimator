import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { Brain, CheckCircle, AlertCircle, MessageSquare, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  context: string;
  suggested_answer: string;
  confidence_score: number;
  status: string;
  source_id: string;
  created_at: string;
}

interface LearningMetrics {
  total_concepts_learned: number;
  concepts_confirmed: number;
  concepts_corrected: number;
  questions_answered: number;
  average_confidence: number;
}

export default function AILearningInsights() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found in AILearningInsights');
      setLoading(false);
      return;
    }

    console.log('Loading AI learning data for user:', user.id);
    const [questionsRes, metricsRes] = await Promise.all([
      supabase.from('ai_learning_questions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('ai_learning_metrics').select('*').eq('user_id', user.id).maybeSingle()

    ]);

    if (questionsRes.error) {
      console.error('Error loading questions:', questionsRes.error);
    } else {
      console.log('Loaded questions:', questionsRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
    }
    
    if (metricsRes.error) {
      console.error('Error loading metrics:', metricsRes.error);
    } else {
      console.log('Loaded metrics:', metricsRes.data);
      if (metricsRes.data) setMetrics(metricsRes.data);
    }
    
    setLoading(false);
  };


  const answerQuestion = async (questionId: string, answer: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('ai_learning_questions').update({
      status: 'answered',
      user_answer: answer,
      answered_at: new Date().toISOString()
    }).eq('id', questionId);

    toast.success('Answer submitted! AI is learning from your feedback.');
    setSelectedQuestion(null);
    setUserAnswer('');
    loadData();
  };

  const skipQuestion = async (questionId: string) => {
    await supabase.from('ai_learning_questions').update({ status: 'skipped' }).eq('id', questionId);
    loadData();
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'clarification': return 'bg-yellow-500';
      case 'confirmation': return 'bg-blue-500';
      case 'missing_info': return 'bg-red-500';
      case 'ambiguity': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status === 'answered');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-purple-600" />
        <div>
          <h2 className="text-2xl font-bold">AI Learning Insights</h2>
          <p className="text-sm text-muted-foreground">See how AI is learning and help clarify concepts</p>
        </div>
      </div>

      {metrics && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Concepts Learned</p>
                  <p className="text-2xl font-bold">{metrics.total_concepts_learned}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.concepts_confirmed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Corrected</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.concepts_corrected}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Avg Confidence</p>
                <Progress value={(metrics.average_confidence || 0) * 100} className="h-2" />
                <p className="text-xl font-bold mt-2">{((metrics.average_confidence || 0) * 100).toFixed(0)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Questions from AI ({pendingQuestions.length} pending)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingQuestions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending questions. AI is confident in its learning!</p>
          ) : (
            pendingQuestions.map(q => (
              <Card key={q.id} className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={getQuestionTypeColor(q.question_type)}>{q.question_type}</Badge>
                    <span className="text-xs text-muted-foreground">Confidence: {(q.confidence_score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="font-medium mb-2">{q.question_text}</p>
                  {q.context && <p className="text-sm text-muted-foreground mb-3">Context: {q.context}</p>}
                  {q.suggested_answer && (
                    <div className="bg-muted p-3 rounded mb-3">
                      <p className="text-xs font-medium mb-1">AI's Current Understanding:</p>
                      <p className="text-sm">{q.suggested_answer}</p>
                    </div>
                  )}
                  {selectedQuestion === q.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Your answer or clarification..."
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => answerQuestion(q.id, userAnswer)} disabled={!userAnswer}>Submit Answer</Button>
                        <Button variant="outline" onClick={() => setSelectedQuestion(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setSelectedQuestion(q.id)}>Answer</Button>
                      <Button size="sm" variant="outline" onClick={() => skipQuestion(q.id)}>Skip</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {answeredQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Answered ({answeredQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {answeredQuestions.slice(0, 5).map(q => (
              <div key={q.id} className="border-l-4 border-l-green-500 pl-4 py-2">
                <p className="font-medium text-sm">{q.question_text}</p>
                <p className="text-xs text-green-600 mt-1">✓ Your answer: {q.user_answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}