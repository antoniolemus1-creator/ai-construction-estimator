import { useState, useRef, useCallback } from 'react';
import { Recording } from '@/types/recording';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useScreenRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingDurationRef = useRef<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadRecordings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error loading recordings', description: error.message, variant: 'destructive' });
    } else {
      setRecordings(data || []);
    }
  }, [user, toast]);

  const startRecording = async () => {
    if (!user) {
      toast({ title: 'Authentication required', description: 'Please sign in to record', variant: 'destructive' });
      return;
    }
    try {
      // Check if getDisplayMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen recording is not supported in this browser. Please use Chrome, Edge, or Firefox.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          mediaSource: 'screen' as any,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }, 
        audio: true 
      });

      streamRef.current = stream;
      
      // Check if MediaRecorder supports webm
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => { 
        if (e.data.size > 0) {
          chunksRef.current.push(e.data); 
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const fileName = `${user.id}/${Date.now()}.webm`;
        const duration = recordingDurationRef.current;
        
        console.log('Recording stopped. Blob size:', blob.size, 'Duration:', duration);
        toast({ title: 'Saving recording...', description: 'Uploading to cloud storage' });
        
        // Upload to storage
        console.log('Uploading to storage bucket "recordings" with path:', fileName);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recordings')
          .upload(fileName, blob, {
            contentType: 'video/webm',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          toast({ 
            title: 'Upload failed', 
            description: `Storage error: ${uploadError.message}. Check if 'recordings' bucket exists and is public.`, 
            variant: 'destructive' 
          });
          return;
        }
        
        console.log('Upload successful:', uploadData);
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage.from('recordings').getPublicUrl(fileName);
        console.log('Public URL:', publicUrl);
        
        // Insert into database
        const recordData = {
          user_id: user.id,
          title: `Recording ${new Date().toLocaleString()}`,
          video_url: publicUrl,
          duration: duration,
          file_size: blob.size
        };
        console.log('Inserting into database:', recordData);
        
        const { data: dbData, error: dbError } = await supabase
          .from('recordings')
          .insert(recordData)
          .select();
        
        if (dbError) {
          console.error('Database insert error:', dbError);
          toast({ 
            title: 'Save failed', 
            description: `Database error: ${dbError.message}. Check RLS policies on recordings table.`, 
            variant: 'destructive' 
          });
        } else {
          console.log('Database insert successful:', dbData);
          toast({ 
            title: 'Recording saved successfully!', 
            description: `${Math.floor(duration / 60)}m ${duration % 60}s recording saved to cloud` 
          });
          loadRecordings();
        }
        
        // Reset after save
        chunksRef.current = [];
        recordingDurationRef.current = 0;
      };


      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      recordingDurationRef.current = 0;
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
        recordingDurationRef.current += 1;
      }, 1000);
      
      toast({ title: 'Recording started', description: 'Screen capture is now active' });
      
      // Handle user stopping the stream from browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });
      
    } catch (error: any) {
      toast({ title: 'Recording failed', description: error.message || 'Could not start screen capture', variant: 'destructive' });
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop timer first
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Stop recording - this will trigger onstop handler
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      
      // Reset UI state
      setIsRecording(false);
      setIsPaused(false);
      setRecordingTime(0);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      if (timerRef.current) clearInterval(timerRef.current);
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
        recordingDurationRef.current += 1;
      }, 1000);
      setIsPaused(false);
    }
  };

  return { isRecording, isPaused, recordingTime, recordings, startRecording, stopRecording, pauseRecording, resumeRecording, loadRecordings };
};
