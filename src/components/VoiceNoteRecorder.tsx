import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Play, Pause, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VoiceNoteRecorderProps {
  timestamp: number;
  onSave: (audioUrl: string, duration: number) => void;
  onCancel: () => void;
}

export function VoiceNoteRecorder({ timestamp, onSave, onCancel }: VoiceNoteRecorderProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setDuration(Date.now() - startTimeRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSave = async () => {
    if (!audioUrl || !user) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const fileName = `voice-note-${Date.now()}.webm`;
      
      const { data, error } = await supabase.storage
        .from('recordings')
        .upload(`${user.id}/${fileName}`, blob);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('recordings')
        .getPublicUrl(data.path);

      onSave(urlData.publicUrl, duration);
      toast.success('Voice note saved');
    } catch (error) {
      console.error('Error saving voice note:', error);
      toast.error('Failed to save voice note');
    }
  };

  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <h3 className="text-lg font-bold text-white mb-4">Voice Note at {Math.floor(timestamp / 1000)}s</h3>
      
      <div className="flex flex-col items-center gap-4">
        {!audioUrl ? (
          <>
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              size="lg"
              className={isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}
            >
              {isRecording ? <Square className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
            {isRecording && <p className="text-sm text-gray-400 animate-pulse">Recording...</p>}
          </>
        ) : (
          <>
            <audio src={audioUrl} controls className="w-full" />
            <div className="flex gap-2 w-full">
              <Button onClick={handleSave} className="flex-1 bg-green-500 hover:bg-green-600">
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button onClick={() => setAudioUrl(null)} variant="outline" className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" /> Discard
              </Button>
            </div>
          </>
        )}
        <Button onClick={onCancel} variant="ghost" className="w-full">
          Cancel
        </Button>
      </div>
    </Card>
  );
}
