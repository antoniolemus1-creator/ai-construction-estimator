import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react';
import { VideoAnnotationPlayer } from '@/components/VideoAnnotationPlayer';
import { VideoAnnotationToolbar } from '@/components/VideoAnnotationToolbar';
import { VideoAnnotationsList } from '@/components/VideoAnnotationsList';
import { VoiceNoteRecorder } from '@/components/VoiceNoteRecorder';
import { WorkflowDocumentationGenerator } from '@/components/WorkflowDocumentationGenerator';
import { VideoAnnotation, WorkflowStep } from '@/types/videoAnnotations';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

export default function VideoAnnotationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { recordingId } = useParams();
  const [videoUrl, setVideoUrl] = useState('');
  const [annotations, setAnnotations] = useState<VideoAnnotation[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#f59e0b');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);


  useEffect(() => {
    if (!user || !recordingId) {
      navigate('/');
      return;
    }
    loadRecording();
    loadAnnotations();
  }, [user, recordingId]);

  const loadRecording = async () => {
    if (!recordingId) return;
    
    const { data, error } = await supabase
      .from('screen_recordings')
      .select('video_url')
      .eq('id', recordingId)
      .single();

    if (error) {
      toast.error('Failed to load recording');
      return;
    }

    setVideoUrl(data.video_url);
  };

  const loadAnnotations = async () => {
    if (!recordingId) return;

    const { data, error } = await supabase
      .from('video_annotations')
      .select('*')
      .eq('recording_id', recordingId)
      .order('timestamp_ms', { ascending: true });

    if (error) {
      console.error('Error loading annotations:', error);
      return;
    }

    setAnnotations(data || []);
  };

  const addAnnotation = async (type: string, title?: string) => {
    if (!user || !recordingId) return;

    const annotation: Partial<VideoAnnotation> = {
      recording_id: recordingId,
      user_id: user.id,
      timestamp_ms: currentTime,
      type: type as any,
      title,
      color: activeColor,
      data: {}
    };

    const { data, error } = await supabase
      .from('video_annotations')
      .insert(annotation)
      .select()
      .single();

    if (error) {
      toast.error('Failed to add annotation');
      return;
    }

    setAnnotations([...annotations, data]);
    toast.success('Annotation added');
  };

  const deleteAnnotation = async (id: string) => {
    const { error } = await supabase
      .from('video_annotations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete annotation');
      return;
    }

    setAnnotations(annotations.filter(a => a.id !== id));
    toast.success('Annotation deleted');
  };

  const saveWorkflow = async (title: string, description: string, steps: WorkflowStep[]) => {
    if (!user || !recordingId) return;

    const { error } = await supabase
      .from('workflow_documentation')
      .insert({
        recording_id: recordingId,
        user_id: user.id,
        title,
        description,
        steps
      });

    if (error) {
      toast.error('Failed to save workflow');
      return;
    }

    toast.success('Workflow documentation saved');
  };

  const runAIAnalysis = async () => {
    if (!user || !recordingId || !videoUrl) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    toast.info('Starting AI analysis...');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-screen-recording', {
        body: { 
          recordingId, 
          videoUrl,
          sampleInterval: 5 
        }
      });

      if (error) throw error;

      // Save AI-generated annotations to database
      const aiAnnotations = data.annotations || [];
      let savedCount = 0;

      for (const aiAnnotation of aiAnnotations) {
        setAnalysisProgress((savedCount / aiAnnotations.length) * 100);

        const annotation: Partial<VideoAnnotation> = {
          recording_id: recordingId,
          user_id: user.id,
          timestamp_ms: aiAnnotation.timestamp * 1000,
          type: aiAnnotation.type,
          title: aiAnnotation.label,
          description: aiAnnotation.description,
          color: aiAnnotation.color,
          data: { ai_generated: true }
        };

        const { data: saved, error: saveError } = await supabase
          .from('video_annotations')
          .insert(annotation)
          .select()
          .single();

        if (!saveError && saved) {
          setAnnotations(prev => [...prev, saved]);
          savedCount++;
        }
      }

      setAnalysisProgress(100);
      toast.success(`AI analysis complete! Added ${savedCount} annotations`);
      await loadAnnotations();
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast.error('Failed to analyze recording: ' + error.message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      <nav className="border-b border-amber-900/20 bg-[#0a0e1a]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/screen-recording')} variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white">Video Annotation Studio</h1>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* AI Analysis Button and Progress */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            onClick={runAIAnalysis}
            disabled={isAnalyzing || !videoUrl}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Auto-Annotate
              </>
            )}
          </Button>
          {isAnalyzing && (
            <div className="flex-1 max-w-md">
              <Progress value={analysisProgress} className="h-2" />
              <p className="text-sm text-gray-400 mt-1">
                Analyzing video and detecting interactions...
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <VideoAnnotationPlayer
              videoUrl={videoUrl}
              annotations={annotations}
              onTimeUpdate={setCurrentTime}
              drawingMode={drawingMode}
            />

            <Tabs defaultValue="tools" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tools">Annotation Tools</TabsTrigger>
                <TabsTrigger value="workflow">Workflow Documentation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tools">
                <VideoAnnotationToolbar
                  activeTool={activeTool}
                  activeColor={activeColor}
                  onToolSelect={(tool) => {
                    setActiveTool(tool);
                    setDrawingMode(true);
                  }}
                  onColorSelect={setActiveColor}
                  onAddMarker={() => addAnnotation('marker', 'Marker')}
                  onAddLabel={() => addAnnotation('label', 'Label')}
                  onStartVoiceNote={() => setShowVoiceRecorder(true)}
                  onAddHighlight={() => addAnnotation('highlight', 'Highlight')}
                  onAddWorkflowStep={() => addAnnotation('workflow_step', `Step ${annotations.filter(a => a.type === 'workflow_step').length + 1}`)}
                  onUndo={() => {}}
                  onClear={() => {}}
                />
              </TabsContent>
              
              <TabsContent value="workflow">
                <WorkflowDocumentationGenerator
                  annotations={annotations}
                  recordingId={recordingId || ''}
                  onSave={saveWorkflow}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <VideoAnnotationsList
              annotations={annotations}
              onSeekTo={(time) => setCurrentTime(time)}
              onEdit={() => {}}
              onDelete={deleteAnnotation}
            />
          </div>
        </div>
      </div>

      <Dialog open={showVoiceRecorder} onOpenChange={setShowVoiceRecorder}>
        <DialogContent>
          <VoiceNoteRecorder
            timestamp={currentTime}
            onSave={async (audioUrl, duration) => {
              await addAnnotation('voice_note', 'Voice Note');
              setShowVoiceRecorder(false);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
