import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FloorPlan3DViewer } from '@/components/FloorPlan3DViewer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Loader2, Box, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: string;
  name: string;
  project_name: string;
  file_name: string;
  created_at: string;
}

export default function Model3DViewerPage() {
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
      if (plan) {
        setSelectedPlan(plan);
      }
    } else if (!planId && plans.length > 0) {
      setSelectedPlan(plans[0]);
    }
  }, [planId, plans]);

  const loadPlans = async () => {
    setLoading(true);

    // Get plans that have takeoff data with coordinates
    const { data: plansData, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (!plansError && plansData) {
      // Filter to plans that have walls with coordinates
      const { data: takeoffData } = await supabase
        .from('takeoff_data')
        .select('plan_id, dimensions')
        .eq('item_type', 'wall')
        .not('dimensions', 'is', null);

      const plansWithWalls = new Set<string>();
      takeoffData?.forEach(item => {
        try {
          const dims = typeof item.dimensions === 'string' ? JSON.parse(item.dimensions) : item.dimensions;
          if (dims?.coordinates?.points) {
            plansWithWalls.add(item.plan_id);
          }
        } catch (e) {
          // Skip invalid dimensions
        }
      });

      const filteredPlans = plansData.filter(p => plansWithWalls.has(p.id));
      setPlans(filteredPlans);

      if (filteredPlans.length > 0 && !planId) {
        setSelectedPlan(filteredPlans[0]);
      }
    }

    setLoading(false);
  };

  const handlePlanChange = (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (plan) {
      setSelectedPlan(plan);
      navigate(`/3d-viewer/${id}`);
    }
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
          <Box className="h-5 w-5 text-muted-foreground" />
          {plans.length > 0 ? (
            <Select value={selectedPlan?.id} onValueChange={handlePlanChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.project_name || plan.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground">No plans with 3D data</span>
          )}
        </div>

        {selectedPlan && (
          <>
            <span className="text-sm text-muted-foreground">
              {new Date(selectedPlan.created_at).toLocaleDateString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/plan-viewer/${selectedPlan.id}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              2D View
            </Button>
          </>
        )}
      </div>

      {/* Viewer */}
      <div className="flex-1">
        {selectedPlan ? (
          <FloorPlan3DViewer planId={selectedPlan.id} />
        ) : plans.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Box className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No 3D Data Available</h2>
              <p className="text-muted-foreground mb-4">
                Extract takeoff data with coordinates from a floor plan to generate a 3D model.
              </p>
              <Button onClick={() => navigate('/ai-plan-analysis')}>
                Go to AI Plan Analysis
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a plan to view in 3D</p>
          </div>
        )}
      </div>
    </div>
  );
}
