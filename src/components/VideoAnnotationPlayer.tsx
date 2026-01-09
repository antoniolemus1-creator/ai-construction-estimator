import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize } from 'lucide-react';
import { VideoAnnotation } from '@/types/videoAnnotations';
import { VideoAnnotationTimeline } from './VideoAnnotationTimeline';
import { VideoDrawingCanvas } from './VideoDrawingCanvas';

interface VideoAnnotationPlayerProps {
  videoUrl: string;
  annotations: VideoAnnotation[];
  onTimeUpdate?: (time: number) => void;
  onAddAnnotation?: (timestamp: number) => void;
  drawingMode?: boolean;
}

export function VideoAnnotationPlayer({
  videoUrl,
  annotations,
  onTimeUpdate,
  onAddAnnotation,
  drawingMode = false
}: VideoAnnotationPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime * 1000;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0] / 1000;
      setCurrentTime(value[0]);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        />
        {drawingMode && <VideoDrawingCanvas currentTime={currentTime} />}
      </div>

      <VideoAnnotationTimeline
        annotations={annotations}
        currentTime={currentTime}
        duration={duration * 1000}
        onSeek={(time) => handleSeek([time])}
      />

      <div className="flex items-center gap-4">
        <Button onClick={() => skip(-5)} variant="ghost" size="icon">
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button onClick={togglePlay} size="icon">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button onClick={() => skip(5)} variant="ghost" size="icon">
          <SkipForward className="w-4 h-4" />
        </Button>
        <Slider value={[currentTime]} max={duration * 1000} onValueChange={handleSeek} className="flex-1" />
        <Button onClick={toggleMute} variant="ghost" size="icon">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </Button>
        <Button onClick={toggleFullscreen} variant="ghost" size="icon">
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
