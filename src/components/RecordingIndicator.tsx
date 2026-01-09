import { Circle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RecordingIndicatorProps {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
}

export const RecordingIndicator = ({ isRecording, isPaused, recordingTime }: RecordingIndicatorProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isRecording);
  }, [isRecording]);

  if (!visible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border-2 ${
        isPaused 
          ? 'bg-yellow-500/90 border-yellow-600' 
          : 'bg-red-500/90 border-red-600'
      } backdrop-blur-sm`}>
        <Circle className={`w-4 h-4 fill-white ${!isPaused && 'animate-pulse'}`} />
        <div className="text-white font-mono font-bold text-lg">
          {formatTime(recordingTime)}
        </div>
        <span className="text-white text-sm font-semibold">
          {isPaused ? 'PAUSED' : 'REC'}
        </span>
      </div>
    </div>
  );
};
