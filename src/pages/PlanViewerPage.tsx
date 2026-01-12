import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InteractivePlanViewer } from '@/components/InteractivePlanViewer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Loader2, Box } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { QuickBidExport } from '@/components/QuickBidExport';

interface Plan {
  id: string;
  name: string;
  file_url: string;
  file_path: string;
  created_at: string;
}

export default function PlanViewerPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (planId && plans.length > 0) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
        loadSignedUrl(plan);
      }
    } else if (!planId && plans.length > 0) {
      setSelectedPlan(plans[0]);
      loadSignedUrl(plans[0]);
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
    }
    setLoading(false);
  };

  const loadSignedUrl = async (plan: Plan) => {
    setLoadingPdf(true);
    setError(null);
    setSignedPdfUrl(null);

    try {
      let storagePath = '';

      // Extract storage path from file_url or use file_path
      if (plan.file_url) {
        // URL format: https://.../storage/v1/object/public/construction-plans/USER_ID/TIMESTAMP_FILENAME.pdf
        const urlParts = plan.file_url.split('/construction-plans/');
        if (urlParts.length > 1) {
          storagePath = urlParts[1];
        }
      }

      if (!storagePath && plan.file_path) {
        storagePath = plan.file_path;
      }

      if (!storagePath) {
        setError('No file path found for this plan');
        setLoadingPdf(false);
        return;
      }

      console.log('Getting signed URL for:', storagePath);

      // Get a signed URL from Supabase storage
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('construction-plans')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (urlError || !signedUrlData) {
        console.error('Error getting signed URL:', urlError);
        setError(`Could not load PDF: ${urlError?.message || 'Unknown error'}`);
        setLoadingPdf(false);
        return;
      }

      console.log('Got signed URL:', signedUrlData.signedUrl.substring(0, 50) + '...');
      setSignedPdfUrl(signedUrlData.signedUrl);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handlePlanChange = (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (plan) {
      setSelectedPlan(plan);
      loadSignedUrl(plan);
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
          <>
            <span className="text-sm text-muted-foreground">
              {new Date(selectedPlan.created_at).toLocaleDateString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/3d-viewer/${selectedPlan.id}`)}
            >
              <Box className="h-4 w-4 mr-2" />
              View in 3D
            </Button>
            <QuickBidExport
              planId={selectedPlan.id}
              planName={selectedPlan.name}
            />
          </>
        )}

        {loadingPdf && (
          <span className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading PDF...
          </span>
        )}
      </div>

      {/* Viewer */}
      <div className="flex-1">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-destructive mb-2">{error}</p>
              <p className="text-sm text-muted-foreground">
                Make sure the plan has been uploaded with a PDF file.
              </p>
            </div>
          </div>
        ) : selectedPlan && signedPdfUrl ? (
          <InteractivePlanViewer
            planId={selectedPlan.id}
            pdfUrl={signedPdfUrl}
            onMeasurement={handleMeasurement}
          />
        ) : selectedPlan && loadingPdf ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a plan to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
