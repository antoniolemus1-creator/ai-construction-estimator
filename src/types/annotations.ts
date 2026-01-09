export interface PlanAnnotation {
  id: string;
  plan_revision_id: string;
  user_id: string;
  annotation_type: 'line' | 'rectangle' | 'text' | 'measurement' | 'callout' | 'arrow';
  position: {
    x: number;
    y: number;
    x2?: number;
    y2?: number;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[];
  };
  style: {
    color?: string;
    strokeWidth?: number;
    fontSize?: number;
    fillOpacity?: number;
  };
  content?: string;
  measurement_data?: {
    length: number;
    unit: string;
    scale: number;
    pixelLength: number;
  };
  page_number: number;
  created_at: string;
  updated_at: string;
}

export interface AnnotationTool {
  id: string;
  name: string;
  icon: any;
  cursor: string;
}
