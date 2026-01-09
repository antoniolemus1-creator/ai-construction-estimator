import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, AlertTriangle, Info, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

interface DataQualityDashboardProps {
  planId: string;
}

export default function DataQualityDashboard({ planId }: DataQualityDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [planId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: metricsData } = await supabase
        .from('data_quality_metrics')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      setMetrics(metricsData);

      const { data: resultsData } = await supabase
        .from('validation_results')
        .select(`
          *,
          extraction:categorized_text_extractions(*),
          rule:validation_rules(*)
        `)
        .in('validation_status', ['failed', 'warning'])
        .order('created_at', { ascending: false });
      
      setValidationResults(resultsData || []);
    } catch (error: any) {
      toast.error('Failed to load validation data');
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    setLoading(true);
    try {
      const { data: extractions } = await supabase
        .from('categorized_text_extractions')
        .select('id')
        .eq('plan_id', planId);
      
      const extractionIds = extractions?.map(e => e.id) || [];
      
      const { data, error } = await supabase.functions.invoke('validate-extracted-data', {
        body: { extractionIds, planId }
      });

      if (error) throw error;
      toast.success(`Validation complete. Quality score: ${data.metrics.qualityScore}%`);
      loadData();
    } catch (error: any) {
      toast.error('Validation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyBulkCorrection = async () => {
    if (selectedItems.size === 0) {
      toast.error('No items selected');
      return;
    }

    try {
      const updates = Array.from(selectedItems).map(async (id) => {
        const result = validationResults.find(r => r.id === id);
        if (result?.suggested_correction) {
          await supabase
            .from('categorized_text_extractions')
            .update({ extracted_text: result.suggested_correction })
            .eq('id', result.extraction_id);
          
          await supabase
            .from('validation_results')
            .update({ validation_status: 'corrected', corrected_at: new Date().toISOString() })
            .eq('id', id);
        }
      });

      await Promise.all(updates);
      toast.success(`Applied corrections to ${selectedItems.size} items`);
      setSelectedItems(new Set());
      loadData();
    } catch (error: any) {
      toast.error('Bulk correction failed');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Data Quality Dashboard</h2>
        <div className="space-x-2">
          <Button onClick={runValidation} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />Run Validation
          </Button>
          {selectedItems.size > 0 && (
            <Button onClick={applyBulkCorrection} variant="default">
              Apply {selectedItems.size} Corrections
            </Button>
          )}
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.quality_score}%</div>
              <Progress value={metrics.quality_score} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.passed_validations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.failed_validations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.warnings}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Flagged Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {validationResults.map(result => (
              <div key={result.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(result.id)}
                      onChange={(e) => {
                        const newSet = new Set(selectedItems);
                        e.target.checked ? newSet.add(result.id) : newSet.delete(result.id);
                        setSelectedItems(newSet);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getSeverityIcon(result.rule?.severity)}
                        <Badge variant={result.validation_status === 'failed' ? 'destructive' : 'secondary'}>
                          {result.extraction?.category}
                        </Badge>
                        <span className="text-sm font-medium">{result.rule?.rule_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{result.rule?.error_message}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Original:</span>
                          <div className="bg-red-50 border border-red-200 rounded px-2 py-1 mt-1">
                            {result.original_value}
                          </div>
                        </div>
                        {result.suggested_correction && (
                          <div>
                            <span className="font-medium">Suggested:</span>
                            <div className="bg-green-50 border border-green-200 rounded px-2 py-1 mt-1">
                              {result.suggested_correction}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {validationResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No validation issues found. Run validation to check data quality.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}