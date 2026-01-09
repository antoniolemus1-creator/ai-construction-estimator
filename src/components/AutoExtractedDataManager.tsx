import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Check, X, Edit, Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AutoExtractedDataManagerProps {
  planId: string;
}

export function AutoExtractedDataManager({ planId }: AutoExtractedDataManagerProps) {
  const [extractedData, setExtractedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadExtractedData();
  }, [planId]);

  const loadExtractedData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auto_extracted_plan_data')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExtractedData(data || []);
    } catch (error) {
      console.error('Error loading extracted data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyData = async (id: string) => {
    try {
      const { error } = await supabase
        .from('auto_extracted_plan_data')
        .update({ 
          verified: true, 
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id 
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'Data verified successfully' });
      loadExtractedData();
    } catch (error: any) {
      toast({ title: 'Error verifying data', description: error.message, variant: 'destructive' });
    }
  };

  const filteredData = selectedType === 'all' 
    ? extractedData 
    : extractedData.filter(item => item.data_type === selectedType);

  const typeCounts = extractedData.reduce((acc, item) => {
    acc[item.data_type] = (acc[item.data_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Auto-Extracted Data</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export to Database
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedType === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('all')}
        >
          All ({extractedData.length})
        </Button>
        {Object.entries(typeCounts).map(([type, count]) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
          >
            {type} ({count})
          </Button>
        ))}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredData.map((item) => (
          <Card key={item.id} className={item.verified ? 'border-green-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{item.data_type}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={item.verified ? 'default' : 'secondary'}>
                    {item.verified ? 'Verified' : 'Pending'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(item.confidence * 100)}% confident
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded mb-3">
                <pre className="text-xs overflow-x-auto">
                  {JSON.stringify(item.extracted_data, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2">
                {!item.verified && (
                  <Button size="sm" onClick={() => verifyData(item.id)}>
                    <Check className="h-4 w-4 mr-1" />
                    Verify
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}