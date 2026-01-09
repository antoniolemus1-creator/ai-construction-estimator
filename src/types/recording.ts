export interface Recording {
  id: string;
  name: string;
  duration: number;
  timestamp: Date;
  videoBlob: Blob;
  annotations: Annotation[];
  thumbnail?: string;
}

export interface Annotation {
  id: string;
  timestamp: number;
  type: 'arrow' | 'circle' | 'text' | 'highlight';
  position: { x: number; y: number };
  data: any;
  color: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  currentTime: number;
  stream: MediaStream | null;
  mediaRecorder: MediaRecorder | null;
  chunks: Blob[];
}
