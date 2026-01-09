import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
];

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadUserLanguagePreference();
  }, []);

  const loadUserLanguagePreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('preferred_voice_language')
        .eq('id', user.id)
        .single();

      if (data?.preferred_voice_language) {
        setSelectedLanguage(data.preferred_voice_language);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const saveLanguagePreference = async (language: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .update({ preferred_voice_language: language })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    saveLanguagePreference(language);
    toast({ 
      title: 'Language updated', 
      description: `Voice input language set to ${LANGUAGES.find(l => l.code === language)?.name}` 
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({ title: 'Recording started', description: 'Speak your question or response' });
    } catch (error: any) {
      toast({ 
        title: 'Microphone access denied', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { 
            audio: base64Audio,
            language: selectedLanguage === 'auto' ? undefined : selectedLanguage
          }
        });

        if (error) throw error;

        if (data?.text) {
          onTranscript(data.text);
          toast({ title: 'Transcription complete!', description: 'Your speech has been converted to text' });
        } else {
          throw new Error('No transcription received');
        }
        setIsTranscribing(false);
      };
    } catch (error: any) {
      toast({ 
        title: 'Transcription failed', 
        description: error.message, 
        variant: 'destructive' 
      });
      setIsTranscribing(false);
    }
  };

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isTranscribing}
        title={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled || isRecording || isTranscribing}
            title="Select language"
          >
            <Languages className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={selectedLanguage === lang.code ? 'bg-accent' : ''}
            >
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
