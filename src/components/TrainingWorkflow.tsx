import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Brain, Play, AlertCircle, Youtube, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from './ui/badge';


interface Recording {
  id: string;
  title: string;
  duration: number;
  created_at: string;
}

export default function TrainingWorkflow() {

  const { user } = useAuth();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [videoAnalyses, setVideoAnalyses] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecordings();
    loadVideoAnalyses();
  }, [user]);

  const loadVideoAnalyses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('video_content_analysis')
      .select('*')
      .eq('user_id', user.id)
      .eq('analysis_status', 'completed')
      .order('analyzed_at', { ascending: false });
    if (data) setVideoAnalyses(data);
  };


  const loadRecordings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('recordings')
      .select('id, title, duration, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setRecordings(data);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const startTraining = async () => {
    if (selectedIds.length === 0) return;
    
    setIsTraining(true);
    setProgress(0);
    setCurrentStep('Initializing...');
    setError('');
    setMetrics(null);

    try {
      const { data: jobData } = await supabase
        .from('training_jobs')
        .insert({
          user_id: user?.id,
          recording_ids: selectedIds,
          status: 'running',
          progress: 0
        })
        .select()
        .single();

      const { data, error: invokeError } = await supabase.functions.invoke('train-ai-model', {
        body: { recordingIds: selectedIds, userId: user?.id }
      });

      if (invokeError) throw invokeError;

      for (const step of data.trainingSteps) {
        setCurrentStep(step.step);
        setProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setMetrics(data.modelMetrics);
      setCurrentStep('Training complete!');

      if (jobData) {
        await supabase
          .from('training_jobs')
          .update({
            status: 'completed',
            progress: 100,
            current_step: 'Training complete',
            features: data.features,
            model_metrics: data.modelMetrics,
            model_version: data.modelVersion,
            completed_at: new Date().toISOString()
          })
          .eq('id', jobData.id);
      }
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-6">
      {videoAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-purple-500" />
              Video Learning Content
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="w-3 h-3 mr-1" />
                {videoAnalyses.length} analyzed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              AI has extracted knowledge from {videoAnalyses.length} training videos. This content enhances the model's understanding of construction estimation techniques.
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {videoAnalyses.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="p-3 bg-purple-50 rounded-lg">
                  <p className="font-medium text-sm">{analysis.video_title}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {analysis.key_concepts?.slice(0, 3).map((concept: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{concept}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Select Recordings for Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recordings.map(rec => (
              <div key={rec.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                <Checkbox
                  checked={selectedIds.includes(rec.id)}
                  onCheckedChange={() => toggleSelection(rec.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{rec.title}</p>
                  <p className="text-sm text-gray-500">{Math.round(rec.duration)}s</p>
                </div>
              </div>
            ))}
          </div>
          <Button
            onClick={startTraining}
            disabled={selectedIds.length === 0 || isTraining}
            className="w-full mt-4"
          >
            <Play className="w-4 h-4 mr-2" />
            Train AI Model ({selectedIds.length} recordings + {videoAnalyses.length} videos)
          </Button>
        </CardContent>
      </Card>


      {(isTraining || currentStep) && (
        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">{currentStep}</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {metrics && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Accuracy</p>
                  <p className="text-2xl font-bold">{(metrics.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Precision</p>
                  <p className="text-2xl font-bold">{(metrics.precision * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Recall</p>
                  <p className="text-2xl font-bold">{(metrics.recall * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">F1 Score</p>
                  <p className="text-2xl font-bold">{(metrics.f1Score * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}