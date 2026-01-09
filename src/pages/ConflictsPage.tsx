import { useState, useEffect } from 'react';
import { ConflictsDashboard } from '@/components/ConflictsDashboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { AlertTriangle, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function ConflictsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')

        .select('id, project_name, document_type')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast.error('Failed to load plans: ' + error.message);
    }
  };

  const runConflictDetection = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    try {
      setDetecting(true);

      // Get spec and drawing data
      const { data: specData } = await supabase
        .from('categorized_text_extractions')
        .select('*')
        .eq('plan_id', selectedPlan)
        .eq('document_type', 'specification');

      const { data: drawingData } = await supabase
        .from('takeoff_data')
        .select('*')
        .eq('plan_id', selectedPlan);

      if (!specData?.length || !drawingData?.length) {
        toast.error('Need both specifications and drawings data to detect conflicts');
        return;
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('detect-plan-conflicts', {
        body: { planId: selectedPlan, specData, drawingData }
      });

      if (error) throw error;

      // Store conflicts
      const user = await supabase.auth.getUser();
      const conflictsToInsert = data.conflicts.map((c: any) => ({
        ...c,
        plan_id: selectedPlan,
        created_by: user.data.user?.id
      }));

      const { error: insertError } = await supabase
        .from('plan_conflicts')
        .insert(conflictsToInsert);

      if (insertError) throw insertError;

      toast.success(`Detected ${data.conflicts.length} conflicts`);
    } catch (error: any) {
      toast.error('Failed to detect conflicts: ' + error.message);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Plan Conflicts
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered conflict detection between specifications and drawings
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPlan} onValueChange={setSelectedPlan}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a plan..." />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runConflictDetection} disabled={detecting}>
            <Play className="h-4 w-4 mr-2" />
            {detecting ? 'Detecting...' : 'Run Detection'}
          </Button>
        </div>
      </div>

      <ConflictsDashboard planId={selectedPlan || undefined} />
    </div>
  );
}