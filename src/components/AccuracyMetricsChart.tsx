import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function AccuracyMetricsChart() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [summary, setSummary] = useState({ correct: 0, incorrect: 0, missed: 0, modified: 0, accuracy: 0 });

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: feedbackData } = await supabase
      .from('extraction_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (feedbackData) {
      const correct = feedbackData.filter(f => f.feedback_type === 'correct').length;
      const incorrect = feedbackData.filter(f => f.feedback_type === 'incorrect').length;
      const missed = feedbackData.filter(f => f.feedback_type === 'missed').length;
      const modified = feedbackData.filter(f => f.feedback_type === 'modified').length;
      const total = correct + incorrect + modified;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      setSummary({ correct, incorrect, missed, modified, accuracy });

      // Group by date
      const byDate = feedbackData.reduce((acc: any, item) => {
        const date = new Date(item.created_at).toLocaleDateString();
        if (!acc[date]) acc[date] = { date, correct: 0, incorrect: 0, missed: 0, modified: 0 };
        acc[date][item.feedback_type]++;
        return acc;
      }, {});

      setMetrics(Object.values(byDate));
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{summary.correct}</div><p className="text-sm text-muted-foreground">Correct</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{summary.incorrect}</div><p className="text-sm text-muted-foreground">Incorrect</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-orange-600">{summary.missed}</div><p className="text-sm text-muted-foreground">Missed</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-blue-600">{summary.modified}</div><p className="text-sm text-muted-foreground">Modified</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-purple-600">{summary.accuracy}%</div><p className="text-sm text-muted-foreground">Accuracy</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Feedback Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="correct" fill="#22c55e" />
              <Bar dataKey="incorrect" fill="#ef4444" />
              <Bar dataKey="missed" fill="#f97316" />
              <Bar dataKey="modified" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
