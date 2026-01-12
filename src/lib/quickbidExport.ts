import * as XLSX from 'xlsx';
import { supabase } from './supabase';

// QuickBid Condition Types mapping
const QUICKBID_CONDITION_TYPES: Record<string, string> = {
  'wall': 'Linear',
  'wall_type_legend': 'Linear',
  'wall_type_total': 'Linear',
  'ceiling': 'Area',
  'door': 'Count',
  'window': 'Count',
  'specification': 'Lump Sum',
};

// Unit mapping for QuickBid
const QUICKBID_UNITS: Record<string, string> = {
  'LF': 'Linear Feet',
  'SF': 'Square Feet',
  'EA': 'Each',
  'LS': 'Lump Sum',
};

interface TakeoffItem {
  id: string;
  plan_id: string;
  page_number: number;
  item_type: string;
  wall_type: string | null;
  quantity: number;
  unit: string;
  room_name: string | null;
  linear_footage: number | null;
  ceiling_area_sqft: number | null;
  notes: string | null;
  dimensions: string | null;
  wall_materials: string | null;
  description: string | null;
}

interface QuickBidCondition {
  'Condition Name': string;
  'Condition Type': string;
  'Quantity': number;
  'Unit': string;
  'Notes': string;
  'Location/Room': string;
  'Page': number;
}

interface WallTypeSummary {
  wallType: string;
  totalLF: number;
  wallCount: number;
  materials: string;
  rooms: string[];
  pages: number[];
}

/**
 * Fetches takeoff data for a plan and exports to QuickBid-compatible Excel format
 */
export async function exportToQuickBid(planId: string, planName: string): Promise<void> {
  // Fetch all takeoff data for the plan
  const { data: takeoffData, error } = await supabase
    .from('takeoff_data')
    .select('*')
    .eq('plan_id', planId)
    .order('page_number, item_type, wall_type');

  if (error) {
    throw new Error(`Failed to fetch takeoff data: ${error.message}`);
  }

  if (!takeoffData || takeoffData.length === 0) {
    throw new Error('No takeoff data found for this plan');
  }

  // Process data into QuickBid format
  const conditions = processToQuickBidFormat(takeoffData as TakeoffItem[]);

  // Create workbook with multiple sheets
  const workbook = XLSX.utils.book_new();

  // Sheet 1: All Conditions (detailed)
  const conditionsSheet = XLSX.utils.json_to_sheet(conditions);
  setColumnWidths(conditionsSheet, [30, 15, 12, 15, 50, 25, 8]);
  XLSX.utils.book_append_sheet(workbook, conditionsSheet, 'Conditions');

  // Sheet 2: Wall Type Summary (for quick reference)
  const wallSummary = createWallTypeSummary(takeoffData as TakeoffItem[]);
  const summarySheet = XLSX.utils.json_to_sheet(wallSummary);
  setColumnWidths(summarySheet, [20, 15, 12, 40, 30, 20]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Wall Type Summary');

  // Sheet 3: Materials List (for ordering)
  const materialsList = createMaterialsList(takeoffData as TakeoffItem[]);
  const materialsSheet = XLSX.utils.json_to_sheet(materialsList);
  setColumnWidths(materialsSheet, [20, 15, 40, 30]);
  XLSX.utils.book_append_sheet(workbook, materialsSheet, 'Materials');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `QuickBid_${planName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;

  // Download the file
  XLSX.writeFile(workbook, filename);
}

/**
 * Process takeoff items into QuickBid condition format
 */
function processToQuickBidFormat(items: TakeoffItem[]): QuickBidCondition[] {
  const conditions: QuickBidCondition[] = [];

  // Group walls by type for aggregated entries
  const wallsByType = new Map<string, TakeoffItem[]>();
  const otherItems: TakeoffItem[] = [];

  for (const item of items) {
    if (item.item_type === 'wall' && item.wall_type) {
      const existing = wallsByType.get(item.wall_type) || [];
      existing.push(item);
      wallsByType.set(item.wall_type, existing);
    } else if (item.item_type !== 'wall_type_legend' && item.item_type !== 'wall_type_total') {
      otherItems.push(item);
    }
  }

  // Add aggregated wall conditions
  for (const [wallType, walls] of wallsByType) {
    const totalLF = walls.reduce((sum, w) => sum + (w.linear_footage || w.quantity || 0), 0);
    const rooms = [...new Set(walls.map(w => w.room_name).filter(Boolean))];
    const pages = [...new Set(walls.map(w => w.page_number))];

    // Get materials info from wall_type_legend if available
    const legendItem = items.find(i =>
      i.item_type === 'wall_type_legend' && i.wall_type === wallType
    );

    let notes = `${walls.length} wall segments`;
    if (legendItem?.wall_materials) {
      try {
        const materials = JSON.parse(legendItem.wall_materials);
        notes += ` | ${materials.composition || ''} | Studs: ${materials.stud_size || 'TBD'} @ ${materials.stud_spacing || 'TBD'}`;
        if (materials.fire_rating) notes += ` | Fire: ${materials.fire_rating}`;
      } catch {
        notes += legendItem.notes ? ` | ${legendItem.notes}` : '';
      }
    }

    conditions.push({
      'Condition Name': `Wall Type ${wallType}`,
      'Condition Type': 'Linear',
      'Quantity': Math.round(totalLF * 100) / 100,
      'Unit': 'Linear Feet',
      'Notes': notes,
      'Location/Room': rooms.join(', ') || 'Various',
      'Page': pages.length === 1 ? pages[0] : 0,
    });
  }

  // Add individual wall entries (detailed breakdown)
  for (const [wallType, walls] of wallsByType) {
    for (const wall of walls) {
      conditions.push({
        'Condition Name': `Wall ${wallType} - ${wall.room_name || 'Segment'}`,
        'Condition Type': 'Linear',
        'Quantity': wall.linear_footage || wall.quantity || 0,
        'Unit': 'Linear Feet',
        'Notes': wall.notes || '',
        'Location/Room': wall.room_name || '',
        'Page': wall.page_number,
      });
    }
  }

  // Add ceilings
  const ceilings = otherItems.filter(i => i.item_type === 'ceiling');
  for (const ceiling of ceilings) {
    conditions.push({
      'Condition Name': `Ceiling - ${ceiling.room_name || 'Area'}`,
      'Condition Type': 'Area',
      'Quantity': ceiling.ceiling_area_sqft || ceiling.quantity || 0,
      'Unit': 'Square Feet',
      'Notes': ceiling.notes || '',
      'Location/Room': ceiling.room_name || '',
      'Page': ceiling.page_number,
    });
  }

  // Add doors
  const doors = otherItems.filter(i => i.item_type === 'door');
  for (const door of doors) {
    conditions.push({
      'Condition Name': `Door - ${door.room_name || 'Opening'}`,
      'Condition Type': 'Count',
      'Quantity': door.quantity || 1,
      'Unit': 'Each',
      'Notes': door.notes || '',
      'Location/Room': door.room_name || '',
      'Page': door.page_number,
    });
  }

  // Add windows
  const windows = otherItems.filter(i => i.item_type === 'window');
  for (const window of windows) {
    conditions.push({
      'Condition Name': `Window - ${window.room_name || 'Opening'}`,
      'Condition Type': 'Count',
      'Quantity': window.quantity || 1,
      'Unit': 'Each',
      'Notes': window.notes || '',
      'Location/Room': window.room_name || '',
      'Page': window.page_number,
    });
  }

  return conditions;
}

/**
 * Create wall type summary for quick reference
 */
function createWallTypeSummary(items: TakeoffItem[]): WallTypeSummary[] {
  const summaryMap = new Map<string, WallTypeSummary>();

  // Get legend items for materials info
  const legendItems = items.filter(i => i.item_type === 'wall_type_legend');
  const legendMap = new Map(legendItems.map(l => [l.wall_type, l]));

  // Process walls
  const walls = items.filter(i => i.item_type === 'wall' && i.wall_type);

  for (const wall of walls) {
    const wallType = wall.wall_type!;
    const existing = summaryMap.get(wallType) || {
      wallType,
      totalLF: 0,
      wallCount: 0,
      materials: '',
      rooms: [],
      pages: [],
    };

    existing.totalLF += wall.linear_footage || wall.quantity || 0;
    existing.wallCount += 1;

    if (wall.room_name && !existing.rooms.includes(wall.room_name)) {
      existing.rooms.push(wall.room_name);
    }
    if (!existing.pages.includes(wall.page_number)) {
      existing.pages.push(wall.page_number);
    }

    // Get materials from legend
    const legend = legendMap.get(wallType);
    if (legend?.wall_materials && !existing.materials) {
      try {
        const materials = JSON.parse(legend.wall_materials);
        existing.materials = `${materials.composition || ''} | ${materials.stud_size || ''} @ ${materials.stud_spacing || ''}`;
      } catch {
        existing.materials = legend.notes || '';
      }
    }

    summaryMap.set(wallType, existing);
  }

  return Array.from(summaryMap.values()).map(s => ({
    'Wall Type': s.wallType,
    'Total LF': Math.round(s.totalLF * 100) / 100,
    'Wall Count': s.wallCount,
    'Materials/Assembly': s.materials || 'See specifications',
    'Rooms': s.rooms.join(', ') || 'Various',
    'Pages': s.pages.join(', '),
  })) as unknown as WallTypeSummary[];
}

/**
 * Create materials list for ordering
 */
function createMaterialsList(items: TakeoffItem[]) {
  const materials: Array<{
    'Wall Type': string;
    'Total LF': number;
    'Material Specification': string;
    'Notes': string;
  }> = [];

  // Get wall type totals and legends
  const totals = items.filter(i => i.item_type === 'wall_type_total');
  const legends = items.filter(i => i.item_type === 'wall_type_legend');
  const legendMap = new Map(legends.map(l => [l.wall_type, l]));

  // If no totals, calculate from individual walls
  if (totals.length === 0) {
    const walls = items.filter(i => i.item_type === 'wall' && i.wall_type);
    const wallTotals = new Map<string, number>();

    for (const wall of walls) {
      const existing = wallTotals.get(wall.wall_type!) || 0;
      wallTotals.set(wall.wall_type!, existing + (wall.linear_footage || wall.quantity || 0));
    }

    for (const [wallType, totalLF] of wallTotals) {
      const legend = legendMap.get(wallType);
      let materialSpec = '';

      if (legend?.wall_materials) {
        try {
          const mat = JSON.parse(legend.wall_materials);
          materialSpec = [
            mat.composition,
            mat.stud_size ? `Studs: ${mat.stud_size}` : '',
            mat.stud_spacing ? `@ ${mat.stud_spacing}` : '',
            mat.fire_rating ? `Fire Rating: ${mat.fire_rating}` : '',
            mat.drywall_type ? `Drywall: ${mat.drywall_type}` : '',
          ].filter(Boolean).join(' | ');
        } catch {
          materialSpec = legend.description || '';
        }
      }

      materials.push({
        'Wall Type': wallType,
        'Total LF': Math.round(totalLF * 100) / 100,
        'Material Specification': materialSpec || 'See partition schedule',
        'Notes': legend?.notes || '',
      });
    }
  } else {
    for (const total of totals) {
      const legend = legendMap.get(total.wall_type!);
      let materialSpec = '';

      if (legend?.wall_materials) {
        try {
          const mat = JSON.parse(legend.wall_materials);
          materialSpec = [
            mat.composition,
            mat.stud_size ? `Studs: ${mat.stud_size}` : '',
            mat.stud_spacing ? `@ ${mat.stud_spacing}` : '',
            mat.fire_rating ? `Fire Rating: ${mat.fire_rating}` : '',
          ].filter(Boolean).join(' | ');
        } catch {
          materialSpec = legend?.description || '';
        }
      }

      materials.push({
        'Wall Type': total.wall_type || 'Unknown',
        'Total LF': total.linear_footage || total.quantity || 0,
        'Material Specification': materialSpec || 'See partition schedule',
        'Notes': total.notes || '',
      });
    }
  }

  return materials;
}

/**
 * Set column widths for better readability
 */
function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet['!cols'] = widths.map(w => ({ wch: w }));
}

/**
 * Export just wall summary for quick import
 */
export async function exportWallSummaryToQuickBid(planId: string, planName: string): Promise<void> {
  const { data: takeoffData, error } = await supabase
    .from('takeoff_data')
    .select('*')
    .eq('plan_id', planId)
    .in('item_type', ['wall', 'wall_type_legend', 'wall_type_total']);

  if (error) {
    throw new Error(`Failed to fetch takeoff data: ${error.message}`);
  }

  if (!takeoffData || takeoffData.length === 0) {
    throw new Error('No wall data found for this plan');
  }

  // Create simplified QuickBid format
  const wallSummary = createWallTypeSummary(takeoffData as TakeoffItem[]);

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(wallSummary);
  setColumnWidths(sheet, [20, 15, 12, 40, 30, 20]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Wall Summary');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `QuickBid_Walls_${planName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, filename);
}
