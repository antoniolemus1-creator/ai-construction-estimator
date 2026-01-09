import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Download, Trash2 } from 'lucide-react';
import { Recording, Annotation } from '@/types/recording';
import { AnnotationCanvas } from './AnnotationCanvas';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface WorkflowReplayProps {
  recording: Recording;
  onClose: () => void;
  onDelete: () => void;
}

export const WorkflowReplay = ({ recording, onClose, onDelete }: WorkflowReplayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadVideo = async () => {
      setIsLoading(true);
      try {
        // Extract the file path from the video_url
        const urlParts = recording.video_url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'recordings');
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        
        // Download the video blob from storage
        const { data, error } = await supabase.storage
          .from('recordings')
          .download(filePath);
        
        if (error) throw error;
        
        // Create a blob URL for the video
        const url = URL.createObjectURL(data);
        setVideoUrl(url);
      } catch (error: any) {
        console.error('Error loading video:', error);
        toast({ 
          title: 'Error loading video', 
          description: error.message || 'Could not load recording', 
          variant: 'destructive' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();

    // Cleanup blob URL on unmount
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [recording.video_url, toast]);

  useEffect(() => {
    const loadAnnotations = async () => {
      const { data } = await supabase
        .from('annotations')
        .select('*')
        .eq('recording_id', recording.id);
      if (data) setAnnotations(data);
    };
    loadAnnotations();
  }, [recording.id]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleDownload = async () => {
    try {
      // Extract the file path from the video_url
      const urlParts = recording.video_url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'recordings');
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      const { data, error } = await supabase.storage.from('recordings').download(filePath);
      if (error) throw error;
      
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${recording.title}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Download started', description: 'Video is being downloaded' });
      }
    } catch (error: any) {
      toast({ title: 'Download failed', description: error.message, variant: 'destructive' });
    }
  };


  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this recording?')) {
      const { error } = await supabase.from('recordings').delete().eq('id', recording.id);
      if (error) {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Recording deleted' });
        onDelete();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const visibleAnnotations = annotations.filter(
    ann => Math.abs(ann.timestamp - currentTime) < 0.5
  );


  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl bg-[#1a1f2e] border-cyan-500/20 p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">{recording.title}</h3>
            <div className="flex gap-2">
              <Button onClick={handleDelete} variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button onClick={onClose} variant="outline">Close</Button>
            </div>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white">Loading video...</div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  playsInline
                  preload="auto"
                />
                <AnnotationCanvas
                  videoRef={videoRef.current}
                  annotations={visibleAnnotations}
                  activeTool="pointer"
                  activeColor="#00d4ff"
                  onAddAnnotation={() => {}}
                />
              </>
            )}
          </div>



          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button onClick={() => handleSkip(-10)} variant="outline">
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button onClick={handlePlayPause} className="bg-cyan-600 hover:bg-cyan-700">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button onClick={() => handleSkip(10)} variant="outline">
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
