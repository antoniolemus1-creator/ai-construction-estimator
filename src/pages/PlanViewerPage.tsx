import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InteractivePlanViewer } from '@/components/InteractivePlanViewer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
}

export default function PlanViewerPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (planId && plans.length > 0) {
      const plan = plans.find(p => p.id === planId);
      if (plan) setSelectedPlan(plan);
    }
  }, [planId, plans]);

  const loadPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPlans(data);
      if (!planId && data.length > 0) {
        setSelectedPlan(data[0]);
      }
    }
    setLoading(false);
  };

  const handlePlanChange = (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (plan) {
      setSelectedPlan(plan);
      navigate(`/plan-viewer/${id}`);
    }
  };

  const handleMeasurement = (length: number, unit: string) => {
    console.log(`Measured: ${length.toFixed(2)} ${unit}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-3 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedPlan?.id} onValueChange={handlePlanChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlan && (
          <span className="text-sm text-muted-foreground">
            {new Date(selectedPlan.created_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Viewer */}
      <div className="flex-1">
        {selectedPlan ? (
          <InteractivePlanViewer
            planId={selectedPlan.id}
            pdfUrl={selectedPlan.file_url}
            onMeasurement={handleMeasurement}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a plan to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
