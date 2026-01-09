import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Brain, TrendingUp, Database, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TrainingJob {
  id: string;
  status: string;
  progress: number;
  model_metrics: any;
  created_at: string;
  completed_at: string;
}

export default function AIStatusIndicator() {

  const { user } = useAuth();
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [stats, setStats] = useState({
    totalTrainings: 0,
    avgAccuracy: 0,
    totalRecordings: 0
  });

  useEffect(() => {
    if (user) {
      loadTrainingHistory();
      loadStats();
    }
  }, [user]);

  const loadTrainingHistory = async () => {
    const { data } = await supabase
      .from('training_jobs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setJobs(data);
  };

  const loadStats = async () => {
    const { data: jobsData } = await supabase
      .from('training_jobs')
      .select('model_metrics')
      .eq('user_id', user?.id)
      .eq('status', 'completed');

    const { count } = await supabase
      .from('recordings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);

    if (jobsData && jobsData.length > 0) {
      const avgAcc = jobsData.reduce((sum, job) => 
        sum + (job.model_metrics?.accuracy || 0), 0) / jobsData.length;
      setStats({
        totalTrainings: jobsData.length,
        avgAccuracy: avgAcc,
        totalRecordings: count || 0
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          AI Model Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <Database className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{stats.totalRecordings}</p>
            <p className="text-xs text-gray-500">Recordings</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{stats.totalTrainings}</p>
            <p className="text-xs text-gray-500">Trainings</p>
          </div>
          <div className="text-center">
            <Brain className="w-6 h-6 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">{(stats.avgAccuracy * 100).toFixed(0)}%</p>
            <p className="text-xs text-gray-500">Avg Accuracy</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Recent Training Jobs</h4>
          <div className="space-y-2">
            {jobs.slice(0, 3).map(job => (
              <div key={job.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-600">
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                  {job.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}