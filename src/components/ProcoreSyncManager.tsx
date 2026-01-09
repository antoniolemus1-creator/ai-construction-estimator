import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Image, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Props {
  accessToken: string;
  companyId: string;
  projectId: string;
}

export default function ProcoreSyncManager({ accessToken, companyId, projectId }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  const syncEstimates = async () => {
    setSyncing(true);
    try {
      // Get AI-generated estimates from localStorage
      const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
      
      for (const estimate of estimates) {
        // Create budget line items in Procore
        await supabase.functions.invoke('procore-api', {
          body: {
            action: 'create_budget_line_item',
            accessToken,
            companyId,
            projectId,
            data: {
              description: estimate.description || 'AI-Generated Estimate',
              cost_code: estimate.costCode || 'AUTO',
              budgeted_cost: estimate.totalCost || 0,
              notes: `AI Analysis: ${estimate.notes || ''}`
            }
          }
        });
      }

      setLastSync(new Date());
      toast({ title: 'Sync Complete', description: `${estimates.length} estimates synced to Procore` });
    } catch (err) {
      console.error('Sync error:', err);
      toast({ title: 'Error', description: 'Failed to sync estimates', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const syncPhotos = async () => {
    setSyncing(true);
    try {
      // Get captured photos from localStorage
      const photos = JSON.parse(localStorage.getItem('sitePhotos') || '[]');
      
      for (const photo of photos) {
        // Upload photos to Procore
        await supabase.functions.invoke('procore-api', {
          body: {
            action: 'upload_photo',
            accessToken,
            companyId,
            projectId,
            data: {
              image: photo.imageData,
              description: photo.analysis?.summary || 'Site Photo',
              tags: photo.analysis?.elements || []
            }
          }
        });
      }

      setLastSync(new Date());
      toast({ title: 'Sync Complete', description: `${photos.length} photos synced to Procore` });
    } catch (err) {
      console.error('Sync error:', err);
      toast({ title: 'Error', description: 'Failed to sync photos', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Sync to Procore
        </CardTitle>
        <CardDescription>Push AI-generated data to your Procore project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={syncEstimates} disabled={syncing} variant="outline" className="h-24 flex-col gap-2">
            <FileText className="w-6 h-6" />
            <span>Sync Estimates</span>
          </Button>
          
          <Button onClick={syncPhotos} disabled={syncing} variant="outline" className="h-24 flex-col gap-2">
            <Image className="w-6 h-6" />
            <span>Sync Photos</span>
          </Button>
        </div>

        {lastSync && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Last synced: {lastSync.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
