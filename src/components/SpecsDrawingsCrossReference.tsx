import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, XCircle, ArrowLeftRight, Loader2, Clock, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CrossReferenceProps {
  planId: string;
}

export default function SpecsDrawingsCrossReference({ planId }: CrossReferenceProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [projectName, setProjectName] = useState<string>('');
  const [projectPlans, setProjectPlans] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadProjectInfo();
    loadSyncStatus();
    loadHistory();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('cross-ref-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'cross_reference_sync_status', filter: `plan_id=eq.${planId}` },
        () => loadSyncStatus()
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cross_reference_history', filter: `plan_id=eq.${planId}` },
        () => loadHistory()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [planId]);

  const loadProjectInfo = async () => {
    const { data: currentPlan } = await supabase
      .from('plans')
      .select('project_name')
      .eq('id', planId)
      .single();

    if (currentPlan?.project_name) {
      setProjectName(currentPlan.project_name);
      
      // Load all plans in this project
      const { data: allPlans } = await supabase
        .from('plans')
        .select('*')
        .eq('project_name', currentPlan.project_name)
        .order('created_at', { ascending: false });
      
      if (allPlans) {
        setProjectPlans(allPlans);
      }
    }
  };

  const loadSyncStatus = async () => {
    const { data } = await supabase
      .from('cross_reference_sync_status')
      .select('*')
      .eq('plan_id', planId)
      .single();
    if (data) setSyncStatus(data);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('cross_reference_history')
      .select('*')
      .eq('plan_id', planId)
      .order('detected_at', { ascending: false })
      .limit(20);
    if (data) setHistory(data);
  };


  const toggleAutoSync = async () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    
    await supabase
      .from('cross_reference_sync_status')
      .upsert({
        plan_id: planId,
        auto_sync_enabled: newValue,
        updated_at: new Date().toISOString()
      });
    
    toast({ 
      title: newValue ? 'Auto-sync enabled' : 'Auto-sync disabled',
      description: newValue ? 'Cross-references will update automatically' : 'Manual sync required'
    });
  };


  const runCrossReference = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cross-reference-specs-drawings', {
        body: { planId }
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      toast({ title: 'Cross-reference complete', description: 'Analysis results are ready' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sync Status
              </span>
              <Button variant="outline" size="sm" onClick={toggleAutoSync}>
                {autoSyncEnabled ? 'Disable Auto-Sync' : 'Enable Auto-Sync'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Sync</p>
                <p className="font-medium">{new Date(syncStatus.last_sync_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge>{syncStatus.sync_status}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Discrepancies</p>
                <p className="font-medium">{syncStatus.total_discrepancies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Cross-Reference: {projectName}
          </CardTitle>
          {projectPlans.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {projectPlans.length} file(s) in this project
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {projectPlans.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Project Files:</h4>
              <div className="space-y-1">
                {projectPlans.map((plan) => (
                  <div key={plan.id} className="text-sm flex items-center gap-2">
                    <Badge variant={plan.document_type === 'drawings' ? 'default' : 'secondary'}>
                      {plan.document_type}
                    </Badge>
                    <span className="text-muted-foreground">{plan.file_name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Button onClick={runCrossReference} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Analyzing...' : 'Run Cross-Reference Analysis'}
          </Button>

          
          {history.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Changes
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="text-sm p-2 border rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.change_type}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.detected_at).toLocaleString()}
                      </span>
                    </div>
                    {item.item_description && (
                      <p className="text-muted-foreground mt-1">{item.item_description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {analysis && (
        <Tabs defaultValue="matches" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="matches">Matches ({analysis.matches?.length || 0})</TabsTrigger>
            <TabsTrigger value="discrepancies">Discrepancies ({analysis.discrepancies?.length || 0})</TabsTrigger>
            <TabsTrigger value="unmatched">Unmatched</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-4">
            {analysis.matches?.map((match: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">{match.takeoffItem}</h3>
                        <Badge variant="outline">{match.confidence}% match</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Spec Section: <span className="font-medium">{match.specSection}</span>
                      </p>
                      <p className="text-sm">{match.details}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="discrepancies" className="space-y-4">
            {analysis.discrepancies?.map((disc: any, idx: number) => (
              <Card key={idx} className="border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{disc.takeoffItem}</h3>
                        <Badge variant={getSeverityColor(disc.severity)}>{disc.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Spec Section: {disc.specSection}
                      </p>
                      <p className="text-sm">{disc.issue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="unmatched" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Items in Drawings Not Found in Specs</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.unmatchedTakeoff?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Items in Specs Not Found in Drawings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.unmatchedSpecs?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {analysis.recommendations?.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-600 mt-2" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}