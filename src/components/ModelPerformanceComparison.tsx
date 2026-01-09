import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Award, Target } from 'lucide-react';

export function ModelPerformanceComparison() {
  const [models, setModels] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);

  useEffect(() => {
    loadModels();
    loadPerformanceData();
  }, []);

  const loadModels = async () => {
    const { data } = await supabase
      .from('fine_tuned_models')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setModels(data);
  };

  const loadPerformanceData = async () => {
    const { data } = await supabase
      .from('extraction_metrics')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(30);
    
    if (data) {
      const chartData = data.map(d => ({
        date: new Date(d.created_at).toLocaleDateString(),
        accuracy: d.accuracy_score * 100,
        confidence: d.confidence_score * 100,
        model: d.model_version || 'base'
      }));
      setPerformanceData(chartData);
    }
  };

  const activeModel = models.find(m => m.is_active);
  const baselineAccuracy = 75; // Baseline GPT-4 accuracy

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Model</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModel?.model_name || 'Base GPT-4'}</div>
            <p className="text-xs text-muted-foreground">
              {activeModel ? `Used ${activeModel.usage_count} times` : 'Default model'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeModel?.average_accuracy?.toFixed(1) || baselineAccuracy}%
            </div>
            <p className="text-xs text-muted-foreground">
              {activeModel ? `+${(activeModel.average_accuracy - baselineAccuracy).toFixed(1)}% vs baseline` : 'Baseline performance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeModel ? `+${((activeModel.average_accuracy / baselineAccuracy - 1) * 100).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Relative improvement</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>Accuracy and confidence trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" name="Accuracy %" />
              <Line type="monotone" dataKey="confidence" stroke="#10b981" name="Confidence %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Comparison</CardTitle>
          <CardDescription>Compare all fine-tuned models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.model_name}</span>
                    {model.is_active && <Badge>Active</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {model.usage_count} uses • {model.total_tokens_used?.toLocaleString()} tokens
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{model.average_accuracy?.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}