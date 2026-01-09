import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle, Clock, DollarSign, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvocationLog {
  id: string;
  function_name: string;
  user_id: string;
  video_id: string;
  status: string;
  duration_ms: number;
  error_message?: string;
  error_type?: string;
  openai_model?: string;
  openai_tokens_used?: number;
  openai_cost_usd?: number;
  retry_count: number;
  created_at: string;
}

interface MetricsSummary {
  total_invocations: number;
  successful_invocations: number;
  failed_invocations: number;
  avg_duration_ms: number;
  total_openai_tokens: number;
  total_openai_cost_usd: number;
}

export function FunctionMonitoringDashboard() {
  const [logs, setLogs] = useState<InvocationLog[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const cutoffDate = new Date();
      switch (timeRange) {
        case '1h': cutoffDate.setHours(cutoffDate.getHours() - 1); break;
        case '24h': cutoffDate.setHours(cutoffDate.getHours() - 24); break;
        case '7d': cutoffDate.setDate(cutoffDate.getDate() - 7); break;
        case '30d': cutoffDate.setDate(cutoffDate.getDate() - 30); break;
      }

      const { data: logsData } = await supabase
        .from('function_invocation_logs')
        .select('*')
        .eq('function_name', 'analyze-video-content')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsData) {
        setLogs(logsData);
        calculateMetrics(logsData);
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (logsData: InvocationLog[]) => {
    const total = logsData.length;
    const successful = logsData.filter(l => l.status === 'success').length;
    const failed = total - successful;
    const avgDuration = Math.round(
      logsData.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / total
    );
    const totalTokens = logsData.reduce((sum, l) => sum + (l.openai_tokens_used || 0), 0);
    const totalCost = logsData.reduce((sum, l) => sum + (l.openai_cost_usd || 0), 0);

    setMetrics({
      total_invocations: total,
      successful_invocations: successful,
      failed_invocations: failed,
      avg_duration_ms: avgDuration,
      total_openai_tokens: totalTokens,
      total_openai_cost_usd: totalCost,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      error: { variant: 'destructive', icon: AlertCircle, color: 'text-red-500' },
      timeout: { variant: 'secondary', icon: Clock, color: 'text-orange-500' },
      rate_limited: { variant: 'outline', icon: Zap, color: 'text-yellow-500' },
    };
    const config = variants[status] || variants.error;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading monitoring data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Function Monitoring</h2>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList>
            <TabsTrigger value="1h">1 Hour</TabsTrigger>
            <TabsTrigger value="24h">24 Hours</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invocations</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_invocations}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.successful_invocations} successful, {metrics.failed_invocations} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.total_invocations > 0
                  ? Math.round((metrics.successful_invocations / metrics.total_invocations) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Avg duration: {metrics.avg_duration_ms}ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OpenAI Usage</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.total_openai_cost_usd.toFixed(4)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.total_openai_tokens.toLocaleString()} tokens
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Invocations</CardTitle>
          <CardDescription>Last 100 function calls to analyze-video-content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <Alert>
                <AlertDescription>No invocations found in the selected time range.</AlertDescription>
              </Alert>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      <span className="text-sm font-mono">{log.video_id}</span>
                      {log.retry_count > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {log.retry_count} retries
                        </Badge>
                      )}
                    </div>
                    {log.error_message && (
                      <p className="text-xs text-red-500">{log.error_message}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground space-y-1">
                    <div>{log.duration_ms}ms</div>
                    {log.openai_tokens_used && (
                      <div className="text-xs">
                        {log.openai_tokens_used} tokens | ${log.openai_cost_usd?.toFixed(6)}
                      </div>
                    )}
                    <div className="text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
