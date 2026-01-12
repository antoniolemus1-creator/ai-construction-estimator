// Construction Extraction Types
// Complete TypeScript interfaces for AI-powered construction takeoff

export interface WallExtraction {
  wall_type: string;
  type_code: string;
  linear_feet: number;
  height_ft: number;
  fire_rating?: string;
  stc_rating?: number;
  stud_size?: string;
  stud_gauge?: string;
  stud_spacing?: string;
  drywall_layers?: number;
  insulation?: string;
  location: string;
  floor_level: string;
  is_exterior: boolean;
  confidence: number;
  coordinates?: { start_x: number; start_y: number; end_x: number; end_y: number };
}

export interface CeilingExtraction {
  room_name: string;
  room_number?: string;
  area_sqft: number;
  perimeter_lf: number;
  height_ft: number;
  ceiling_type: 'drywall' | 'act' | 'specialty' | 'exposed';
  material?: string;
  grid_size?: string;
  tile_size?: string;
  fire_rating?: string;
  insulation_above?: string;
  floor_level: string;
  confidence: number;
}

export interface DoorExtraction {
  mark: string;
  width: string;
  height: string;
  thickness?: string;
  door_type: 'hollow_metal' | 'wood' | 'glass' | 'fiberglass';
  material: string;
  style: 'flush' | 'panel' | 'louver' | 'vision_lite';
  fire_rating?: string;
  frame_type: string;
  frame_material: string;
  hardware_set?: string;
  location: string;
  floor_level: string;
  quantity: number;
  confidence: number;
  coordinates?: { x: number; y: number };
}

export interface HardwareSetExtraction {
  set_number: string;
  description: string;
  lockset_function: string;
  manufacturer?: string;
  finish?: string;
  hinges: { type: string; size: string; quantity: number };
  closer?: string;
  stops?: string;
  threshold?: string;
  weatherstrip?: boolean;
  ada_compliant: boolean;
  door_marks: string[];
  confidence: number;
}

export interface WindowExtraction {
  mark: string;
  width: string;
  height: string;
  type: 'fixed' | 'casement' | 'double_hung' | 'slider' | 'awning';
  material: string;
  manufacturer?: string;
  glass_type?: string;
  frame_color?: string;
  u_value?: number;
  shgc?: number;
  location: string;
  floor_level: string;
  quantity: number;
  confidence: number;
  coordinates?: { x: number; y: number };
}

export interface CabinetExtraction {
  cabinet_type: 'base' | 'wall' | 'tall' | 'vanity';
  linear_feet: number;
  material?: string;
  door_style?: string;
  finish?: string;
  countertop?: string;
  hardware?: string;
  location: string;
  floor_level: string;
  confidence: number;
}

export interface TrimExtraction {
  trim_type: 'base' | 'door_casing' | 'window_casing' | 'crown' | 'chair_rail';
  profile?: string;
  size?: string;
  material: string;
  linear_feet: number;
  location: string;
  floor_level: string;
  confidence: number;
}

export interface FinishWoodExtraction {
  item_type: 'paneling' | 'wainscoting' | 'accent_wall' | 'beam_wrap';
  material: string;
  species?: string;
  finish?: string;
  area_sqft?: number;
  linear_feet?: number;
  location: string;
  floor_level: string;
  confidence: number;
}

export interface InsulationExtraction {
  location: string;
  type: string;
  r_value?: string;
  thickness?: string;
  purpose: 'thermal' | 'sound' | 'fire';
  wall_types?: string[];
  confidence: number;
}

export interface ConstructionExtractionData {
  sheet_info: {
    sheet_number: string;
    sheet_title: string;
    sheet_type: string;
    scale?: string;
    floor_level?: string;
    revision?: string;
  };
  walls: WallExtraction[];
  ceilings: CeilingExtraction[];
  doors: DoorExtraction[];
  hardware_sets: HardwareSetExtraction[];
  windows: WindowExtraction[];
  cabinets: CabinetExtraction[];
  trim: TrimExtraction[];
  finish_wood: FinishWoodExtraction[];
  insulation: InsulationExtraction[];
  general_notes: string[];
  extraction_warnings: string[];
  confidence_summary: {
    overall: number;
    by_category: Record<string, number>;
  };
}

export interface ExtractionOptions {
  planId: string;
  projectName?: string;
  pageNumber?: number;
  extractionFocus?: string[];
  drawingScale?: string;
  confidenceThreshold?: number;
}

export interface ExtractionResult {
  success: boolean;
  data?: ConstructionExtractionData;
  error?: string;
  itemsStored?: number;
  processingTime?: number;
}

// Utility Functions

export function getExtractionSummary(data: ConstructionExtractionData) {
  return {
    totalWallsLF: data.walls.reduce((sum, w) => sum + w.linear_feet, 0),
    totalCeilingSF: data.ceilings.reduce((sum, c) => sum + c.area_sqft, 0),
    totalDoors: data.doors.reduce((sum, d) => sum + d.quantity, 0),
    totalHardwareSets: data.hardware_sets.length,
    totalWindows: data.windows.reduce((sum, w) => sum + w.quantity, 0),
    totalCabinetLF: data.cabinets.reduce((sum, c) => sum + c.linear_feet, 0),
    totalTrimLF: data.trim.reduce((sum, t) => sum + t.linear_feet, 0),
    overallConfidence: data.confidence_summary.overall,
    warningsCount: data.extraction_warnings.length
  };
}

export function getLowConfidenceItems(data: ConstructionExtractionData, threshold = 70) {
  const lowConfidence: Array<{ category: string; item: any; confidence: number }> = [];

  data.walls.filter(w => w.confidence < threshold).forEach(w =>
    lowConfidence.push({ category: 'walls', item: w, confidence: w.confidence }));

  data.ceilings.filter(c => c.confidence < threshold).forEach(c =>
    lowConfidence.push({ category: 'ceilings', item: c, confidence: c.confidence }));

  data.doors.filter(d => d.confidence < threshold).forEach(d =>
    lowConfidence.push({ category: 'doors', item: d, confidence: d.confidence }));

  data.windows.filter(w => w.confidence < threshold).forEach(w =>
    lowConfidence.push({ category: 'windows', item: w, confidence: w.confidence }));

  return lowConfidence.sort((a, b) => a.confidence - b.confidence);
}

export function calculateCategoryTotals(data: ConstructionExtractionData) {
  return {
    walls: {
      total_lf: data.walls.reduce((sum, w) => sum + w.linear_feet, 0),
      by_type: data.walls.reduce((acc, w) => {
        acc[w.type_code] = (acc[w.type_code] || 0) + w.linear_feet;
        return acc;
      }, {} as Record<string, number>)
    },
    ceilings: {
      total_sf: data.ceilings.reduce((sum, c) => sum + c.area_sqft, 0),
      by_type: data.ceilings.reduce((acc, c) => {
        acc[c.ceiling_type] = (acc[c.ceiling_type] || 0) + c.area_sqft;
        return acc;
      }, {} as Record<string, number>)
    },
    doors: {
      total: data.doors.reduce((sum, d) => sum + d.quantity, 0),
      by_type: data.doors.reduce((acc, d) => {
        acc[d.door_type] = (acc[d.door_type] || 0) + d.quantity;
        return acc;
      }, {} as Record<string, number>)
    },
    windows: {
      total: data.windows.reduce((sum, w) => sum + w.quantity, 0),
      by_type: data.windows.reduce((acc, w) => {
        acc[w.type] = (acc[w.type] || 0) + w.quantity;
        return acc;
      }, {} as Record<string, number>)
    },
    trim: {
      total_lf: data.trim.reduce((sum, t) => sum + t.linear_feet, 0),
      by_type: data.trim.reduce((acc, t) => {
        acc[t.trim_type] = (acc[t.trim_type] || 0) + t.linear_feet;
        return acc;
      }, {} as Record<string, number>)
    }
  };
}
