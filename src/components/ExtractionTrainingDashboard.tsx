import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { ExtractionFeedbackCard } from './ExtractionFeedbackCard';
import { AccuracyMetricsChart } from './AccuracyMetricsChart';
import { MissedItemsForm } from './MissedItemsForm';
import { useToast } from '@/hooks/use-toast';
import { Brain, TrendingUp } from 'lucide-react';

export function ExtractionTrainingDashboard() {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      loadExtractedItems();
    }
  }, [selectedPlan]);

  const loadPlans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });



    if (data) setPlans(data);
  };

  const loadExtractedItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('takeoff_data')
      .select('*')
      .eq('plan_id', selectedPlan)
      .order('created_at', { ascending: false });

    if (data) setExtractedItems(data);
    setLoading(false);
  };

  const handleFeedbackSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: stats } = await supabase
      .from('user_contribution_stats')
      .select('opted_in')
      .eq('user_id', user.id)
      .single();

    if (stats?.opted_in) {
      const feedbackData = {
        constructionType: plans.find(p => p.id === selectedPlan)?.project_type || 'general',
        items: extractedItems,
        accuracy: calculateAccuracy(extractedItems),
        previousAccuracy: 0
      };

      await supabase.functions.invoke('aggregate-federated-feedback', {
        body: { userId: user.id, planId: selectedPlan, feedbackData }
      });
    }

    toast({ title: 'Training Updated', description: 'Your feedback helps improve extraction accuracy' });
    loadExtractedItems();
  };

  const calculateAccuracy = (items: any[]) => {
    const reviewed = items.filter(i => i.feedback_status);
    if (reviewed.length === 0) return 0;
    const correct = reviewed.filter(i => i.feedback_status === 'correct').length;
    return (correct / reviewed.length) * 100;
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            AI Extraction Training Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Select Plan to Review</label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a construction plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.project_name} - {new Date(plan.created_at).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedPlan && (
        <Tabs defaultValue="review" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="review">Review Extractions</TabsTrigger>
            <TabsTrigger value="missed">Report Missed Items</TabsTrigger>
            <TabsTrigger value="metrics">Accuracy Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4">
            {loading ? (
              <Card><CardContent className="p-8 text-center">Loading...</CardContent></Card>
            ) : extractedItems.length > 0 ? (
              extractedItems.map(item => (
                <ExtractionFeedbackCard key={item.id} item={item} planId={selectedPlan} onFeedbackSubmit={handleFeedbackSubmit} />
              ))
            ) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No extracted items found</CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="missed">
            <MissedItemsForm planId={selectedPlan} onSubmit={handleFeedbackSubmit} />
          </TabsContent>

          <TabsContent value="metrics">
            <AccuracyMetricsChart />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
