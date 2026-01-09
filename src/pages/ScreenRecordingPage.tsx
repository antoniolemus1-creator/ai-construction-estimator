import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Video } from 'lucide-react';
import { RecordingControls } from '@/components/RecordingControls';
import { RecordingIndicator } from '@/components/RecordingIndicator';
import { AnnotationTools } from '@/components/AnnotationTools';
import { WorkflowReplay } from '@/components/WorkflowReplay';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { useScreenRecording } from '@/hooks/useScreenRecording';
import { useEffect, useState } from 'react';
import { Recording, Annotation } from '@/types/recording';


export default function ScreenRecordingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState('pointer');
  const [activeColor, setActiveColor] = useState('#f59e0b');

  const {
    isRecording,
    isPaused,
    recordingTime,
    recordings,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    loadRecordings
  } = useScreenRecording();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    loadRecordings();
  }, [user, navigate, loadRecordings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      <RecordingIndicator isRecording={isRecording} isPaused={isPaused} recordingTime={recordingTime} />
      
      <nav className="border-b border-amber-900/20 bg-[#0a0e1a]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-amber-400 hover:bg-amber-500/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Screen Recording Studio</h1>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">

        <SubscriptionGuard featureName="Screen Recording Studio" requiredTier="basic">
          <div className="space-y-6">
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              currentTime={recordingTime}
              onStart={startRecording}
              onPause={pauseRecording}
              onResume={resumeRecording}
              onStop={stopRecording}
            />

            {isRecording && (
              <AnnotationTools
                onToolSelect={setActiveTool}
                onColorSelect={setActiveColor}
                onUndo={() => setAnnotations(annotations.slice(0, -1))}
                onClear={() => setAnnotations([])}
                disabled={false}
              />
            )}

            <Card className="p-6 bg-[#0f1419] border-amber-900/20">
              <h3 className="text-2xl font-bold text-white mb-6">Recorded Workflows</h3>
              {recordings.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No recordings yet. Start recording to train your AI!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recordings.map(recording => (
                    <Card key={recording.id} className="p-4 bg-[#0a0e1a] border-amber-900/20 hover:border-amber-500/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-bold">{recording.title}</h4>
                          <p className="text-sm text-gray-400">
                            {new Date(recording.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Duration: {Math.floor(recording.duration)}s</p>
                        <div className="flex gap-2">
                          <Button onClick={() => setSelectedRecording(recording)} className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                            <Video className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                          <Button onClick={() => navigate(`/video-annotation/${recording.id}`)} variant="outline" className="flex-1">
                            Annotate
                          </Button>
                        </div>
                      </div>
                    </Card>

                  ))}
                </div>
              )}
            </Card>
          </div>
        </SubscriptionGuard>
      </div>

      {selectedRecording && (
        <WorkflowReplay
          recording={selectedRecording}
          onClose={() => setSelectedRecording(null)}
          onDelete={() => {
            setSelectedRecording(null);
            loadRecordings();
          }}
        />
      )}
    </div>
  );
}
