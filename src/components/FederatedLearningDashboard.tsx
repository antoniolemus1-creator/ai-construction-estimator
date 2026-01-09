import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, Database, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function FederatedLearningDashboard() {
  const [modelVersions, setModelVersions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [versionsRes, insightsRes, metricsRes] = await Promise.all([
      supabase.from('model_versions').select('*').order('created_at', { ascending: false }),
      supabase.from('training_insights').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('extraction_metrics').select('*').order('metric_date', { ascending: false }).limit(30)
    ]);

    if (versionsRes.data) setModelVersions(versionsRes.data);
    if (insightsRes.data) setInsights(insightsRes.data);
    if (metricsRes.data) setMetrics(metricsRes.data);
    setLoading(false);
  };

  const runAggregation = async () => {
    setAggregating(true);
    try {
      const { data, error } = await supabase.functions.invoke('aggregate-federated-learning');
      if (error) throw error;
      toast.success(`Aggregation complete: ${data.insights_generated} insights generated`);
      loadData();
    } catch (error: any) {
      toast.error('Aggregation failed: ' + error.message);
    }
    setAggregating(false);
  };

  const activeModel = modelVersions.find(m => m.is_active);
  const accuracyData = metrics.map(m => ({
    date: new Date(m.metric_date).toLocaleDateString(),
    accuracy: ((m.successful_extractions / m.total_extractions) * 100).toFixed(1),
    clarifications: ((m.clarifications_needed / m.total_extractions) * 100).toFixed(1)
  })).reverse();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Federated Learning Dashboard</h2>
        <Button onClick={runAggregation} disabled={aggregating}>
          <RefreshCw className={`mr-2 h-4 w-4 ${aggregating ? 'animate-spin' : ''}`} />
          Run Aggregation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Model</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModel?.version_number || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {activeModel?.total_extractions || 0} extractions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModel?.extraction_accuracy || 0}%</div>
            <p className="text-xs text-muted-foreground">
              +{((activeModel?.extraction_accuracy || 85) - 85).toFixed(1)}% from baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Insights</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              {insights.filter(i => i.applied_to_model).length} applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeModel?.avg_confidence_score || 0}%</div>
            <p className="text-xs text-muted-foreground">Average extraction confidence</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="versions">Model Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Accuracy Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy %" />
                  <Line type="monotone" dataKey="clarifications" stroke="#82ca9d" name="Clarifications %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.map((insight) => (
                  <div key={insight.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{insight.insight_type.replace(/_/g, ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">{insight.category}</p>
                        <p className="text-sm mt-1">{JSON.stringify(insight.pattern_data)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{insight.confidence_score}% confidence</p>
                        <p className="text-xs text-muted-foreground">{insight.occurrence_count} occurrences</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modelVersions.map((version) => (
                  <div key={version.id} className={`p-4 border rounded-lg ${version.is_active ? 'border-green-500 bg-green-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{version.version_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(version.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {version.is_active && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">ACTIVE</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className="font-semibold">{version.extraction_accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Extractions</p>
                        <p className="font-semibold">{version.total_extractions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Training Data</p>
                        <p className="font-semibold">{version.training_data_count}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
