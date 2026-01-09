import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlanExtractionValidator } from '@/components/PlanExtractionValidator';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlanValidationPage() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const [planData, setPlanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      loadPlanData();
    }
  }, [planId]);

  const loadPlanData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('plans')

      .select('*')
      .eq('id', planId)
      .single();

    if (data) {
      setPlanData(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold">Plan not found</h2>
          <p className="text-muted-foreground">Please select a valid plan to validate.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <PlanExtractionValidator
        planId={planData.id}
        planImageUrl={planData.file_url}
      />
    </div>
  );
}
