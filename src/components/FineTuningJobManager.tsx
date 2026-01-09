import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FineTuningJobManager() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobName, setJobName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from('fine_tuning_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setJobs(data);
  };

  const createJob = async () => {
    if (!jobName) {
      toast({ title: 'Error', description: 'Please enter a job name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('prepare-fine-tuning-job', {
        body: { jobName, organizationId, includeValidationSet: true, minExamples: 10 }
      });

      if (error) throw error;

      toast({ title: 'Success', description: `Job created with ${data.trainingExamples} training examples. Estimated cost: $${data.estimatedCost.toFixed(2)}` });
      setJobName('');
      loadJobs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const startJob = async (jobId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('start-fine-tuning-job', {
        body: { jobId }
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Fine-tuning job started' });
      loadJobs();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      preparing: 'secondary',
      validating: 'secondary',
      queued: 'default',
      running: 'default',
      succeeded: 'default',
      failed: 'destructive',
      cancelled: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    if (status === 'succeeded') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'failed') return <XCircle className="h-5 w-5 text-red-500" />;
    if (status === 'running') return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    return <Clock className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Fine-Tuning Job</CardTitle>
          <CardDescription>Train a custom GPT-4 model on your extraction feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Job Name</Label>
            <Input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="My Custom Extraction Model" />
          </div>
          <div>
            <Label>Organization ID (Optional)</Label>
            <Input value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} placeholder="org-123" />
          </div>
          <Button onClick={createJob} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Prepare Training Data
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <CardTitle className="text-lg">{job.job_name}</CardTitle>
                    <CardDescription>Created {new Date(job.created_at).toLocaleDateString()}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(job.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Training Examples:</span>
                  <span className="ml-2 font-medium">{job.training_data_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Validation Examples:</span>
                  <span className="ml-2 font-medium">{job.validation_data_count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estimated Cost:</span>
                  <span className="ml-2 font-medium">${job.estimated_cost?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Base Model:</span>
                  <span className="ml-2 font-medium">{job.base_model}</span>
                </div>
              </div>
              {job.status === 'preparing' && (
                <Button onClick={() => startJob(job.id)} disabled={loading} size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Start Fine-Tuning
                </Button>
              )}
              {job.status === 'running' && job.trained_tokens && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training Progress</span>
                    <span>{job.trained_tokens?.toLocaleString()} tokens</span>
                  </div>
                  <Progress value={65} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}