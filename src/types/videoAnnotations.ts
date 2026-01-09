export interface VideoAnnotation {
  id: string;
  recording_id: string;
  user_id: string;
  timestamp_ms: number;
  type: 'marker' | 'label' | 'drawing' | 'voice_note' | 'highlight' | 'workflow_step';
  title?: string;
  description?: string;
  data: AnnotationData;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface AnnotationData {
  // For drawings
  paths?: DrawingPath[];
  shapes?: DrawingShape[];
  
  // For highlights
  region?: { x: number; y: number; width: number; height: number };
  
  // For voice notes
  audio_url?: string;
  duration?: number;
  transcription?: string;
  
  // For workflow steps
  step_number?: number;
  action?: string;
  expected_result?: string;
  
  // Common
  position?: { x: number; y: number };
}

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'arrow';
}

export interface DrawingShape {
  type: 'rectangle' | 'circle' | 'arrow' | 'text';
  start: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  color: string;
  width: number;
}

export interface WorkflowDocumentation {
  id: string;
  recording_id: string;
  user_id: string;
  title: string;
  description?: string;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  step_number: number;
  timestamp_ms: number;
  title: string;
  description: string;
  screenshot_url?: string;
  annotations: string[];
}
