import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Circle, Square, Pause, Play, Video } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const RecordingControls = ({
  isRecording,
  isPaused,
  currentTime,
  onStart,
  onPause,
  onResume,
  onStop
}: RecordingControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };


  return (
    <Card className="p-6 bg-[#1a1f2e] border-cyan-500/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <Button onClick={onStart} className="bg-red-600 hover:bg-red-700">
              <Circle className="w-4 h-4 mr-2 fill-white" />
              Start Recording
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button onClick={onResume} className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button onClick={onPause} className="bg-yellow-600 hover:bg-yellow-700">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={onStop} variant="destructive">
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </>
          )}
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
              <span className="text-sm text-gray-400">
                {isPaused ? 'PAUSED' : 'RECORDING'}
              </span>
            </div>
            <div className="text-2xl font-mono text-cyan-400">
              {formatTime(currentTime)}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
