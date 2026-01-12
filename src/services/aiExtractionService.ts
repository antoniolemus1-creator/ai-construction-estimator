// AI Extraction Service
// Service layer for calling the edge function with improved prompts

import { supabase } from '@/lib/supabase';
import type {
  ConstructionExtractionData,
  ExtractionOptions,
  ExtractionResult
} from '@/types/constructionExtraction';

/**
 * Extract data from construction drawings using AI vision
 */
export async function extractFromDrawings(
  imageUrl: string,
  options: ExtractionOptions
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
      body: {
        planId: options.planId,
        action: 'extract_with_vision',
        imageUrl,
        pageNumber: options.pageNumber || 1,
        analysisConfig: {
          drawingScale: options.drawingScale,
          extractionFocus: options.extractionFocus,
          confidenceThreshold: options.confidenceThreshold || 50
        }
      }
    });

    if (error) {
      console.error('Extraction error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data.extracted as ConstructionExtractionData,
      itemsStored: data.itemsStored,
      processingTime: Date.now() - startTime
    };
  } catch (err: any) {
    console.error('Extraction failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Extract data from specifications using OCR
 */
export async function extractFromSpecifications(
  imageUrl: string,
  options: ExtractionOptions
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
      body: {
        planId: options.planId,
        action: 'extract_ocr_text',
        imageUrl,
        pageNumber: options.pageNumber || 1
      }
    });

    if (error) {
      console.error('OCR extraction error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data.extracted,
      itemsStored: data.itemsStored,
      processingTime: Date.now() - startTime
    };
  } catch (err: any) {
    console.error('OCR extraction failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Extract from both drawings and specifications in parallel
 */
export async function extractFromBoth(
  imageUrl: string,
  specImageUrl: string,
  options: ExtractionOptions
): Promise<{ success: boolean; drawings?: any; specifications?: any; data?: any; error?: string }> {
  try {
    const [drawingsResult, specsResult] = await Promise.all([
      extractFromDrawings(imageUrl, options),
      extractFromSpecifications(specImageUrl, options)
    ]);

    if (!drawingsResult.success && !specsResult.success) {
      return {
        success: false,
        error: `Drawings: ${drawingsResult.error}, Specs: ${specsResult.error}`
      };
    }

    return {
      success: true,
      drawings: drawingsResult.data,
      specifications: specsResult.data,
      data: mergeExtractionData(drawingsResult.data, specsResult.data)
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Merge extraction data from drawings and specifications
 */
function mergeExtractionData(drawings?: any, specs?: any) {
  if (!drawings && !specs) return null;
  if (!drawings) return specs;
  if (!specs) return drawings;

  // Merge and deduplicate
  return {
    ...drawings,
    specifications: specs,
    merged: true
  };
}

/**
 * Download extraction data as CSV or JSON
 */
export function downloadExtractionData(
  data: ConstructionExtractionData,
  format: 'csv' | 'json',
  filename: string
) {
  if (format === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${filename}.json`);
  } else {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function convertToCSV(data: ConstructionExtractionData): string {
  const rows: string[][] = [];

  // Header
  rows.push(['Category', 'Item', 'Quantity', 'Unit', 'Location', 'Confidence', 'Notes']);

  // Walls
  data.walls.forEach(w => {
    rows.push(['Wall', w.type_code, w.linear_feet.toString(), 'LF', w.location, w.confidence.toString(), w.fire_rating || '']);
  });

  // Ceilings
  data.ceilings.forEach(c => {
    rows.push(['Ceiling', c.room_name, c.area_sqft.toString(), 'SF', c.floor_level, c.confidence.toString(), c.ceiling_type]);
  });

  // Doors
  data.doors.forEach(d => {
    rows.push(['Door', d.mark, d.quantity.toString(), 'EA', d.location, d.confidence.toString(), `${d.width}x${d.height} ${d.door_type}`]);
  });

  // Windows
  data.windows.forEach(w => {
    rows.push(['Window', w.mark, w.quantity.toString(), 'EA', w.location, w.confidence.toString(), `${w.width}x${w.height} ${w.type}`]);
  });

  // Trim
  data.trim.forEach(t => {
    rows.push(['Trim', t.trim_type, t.linear_feet.toString(), 'LF', t.location, t.confidence.toString(), t.profile || '']);
  });

  // Cabinets
  data.cabinets.forEach(c => {
    rows.push(['Cabinet', c.cabinet_type, c.linear_feet.toString(), 'LF', c.location, c.confidence.toString(), c.material || '']);
  });

  return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Get confidence color based on score
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-green-600';
  if (confidence >= 70) return 'text-blue-600';
  if (confidence >= 50) return 'text-yellow-600';
  if (confidence >= 30) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get confidence label based on score
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'High';
  if (confidence >= 70) return 'Good';
  if (confidence >= 50) return 'Moderate';
  if (confidence >= 30) return 'Low';
  return 'Very Low';
}
