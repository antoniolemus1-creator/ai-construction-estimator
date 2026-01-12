/**
 * Excel Export Utility for Wall Takeoff Reports
 */

import * as XLSX from 'xlsx';
import { WallMaterialReport, MaterialQuantities } from './wallMaterialCalculator';

export interface WallTakeoffRow {
  wallType: string;
  linearFootage: number;
  roomName: string;
  description?: string;
  notes?: string;
}

export interface WallTypeLegendRow {
  typeCode: string;
  description: string;
  composition?: string;
  studSize?: string;
  studSpacing?: string;
  fireRating?: string;
  stcRating?: number;
  layers?: number;
  drywallType?: string;
}

/**
 * Export wall takeoff data to Excel
 */
export function exportWallTakeoffToExcel(
  projectName: string,
  wallData: WallTakeoffRow[],
  wallTypeLegend: WallTypeLegendRow[],
  wallTypeTotals: { typeCode: string; totalLF: number; count: number }[],
  materialReport?: WallMaterialReport
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Wall Type Summary
  const summaryData = wallTypeTotals.map(wt => {
    const legend = wallTypeLegend.find(l => l.typeCode === wt.typeCode);
    return {
      'Wall Type': wt.typeCode,
      'Description': legend?.description || '',
      'Total Linear Ft': wt.totalLF,
      'Wall Count': wt.count,
      'Stud Size': legend?.studSize || 'TBD',
      'Stud Spacing': legend?.studSpacing || 'TBD',
      'Fire Rating': legend?.fireRating || 'N/A',
      'Layers/Side': legend?.layers || 1,
      'Drywall Type': legend?.drywallType || 'TBD'
    };
  });
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  setColumnWidths(summarySheet, [12, 40, 15, 12, 12, 12, 12, 12, 15]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Wall Type Summary');

  // Sheet 2: Wall Type Legend
  const legendData = wallTypeLegend.map(wt => ({
    'Type Code': wt.typeCode,
    'Description': wt.description,
    'Composition': wt.composition || '',
    'Stud Size': wt.studSize || '',
    'Stud Spacing': wt.studSpacing || '',
    'Fire Rating': wt.fireRating || '',
    'STC Rating': wt.stcRating || '',
    'Layers/Side': wt.layers || 1,
    'Drywall Type': wt.drywallType || ''
  }));
  const legendSheet = XLSX.utils.json_to_sheet(legendData);
  setColumnWidths(legendSheet, [12, 50, 40, 12, 12, 12, 12, 12, 15]);
  XLSX.utils.book_append_sheet(workbook, legendSheet, 'Wall Type Legend');

  // Sheet 3: Detailed Wall List
  const detailData = wallData.map(w => ({
    'Wall Type': w.wallType,
    'Room/Location': w.roomName,
    'Linear Footage': w.linearFootage,
    'Description': w.description || '',
    'Notes': w.notes || ''
  }));
  const detailSheet = XLSX.utils.json_to_sheet(detailData);
  setColumnWidths(detailSheet, [12, 25, 15, 40, 40]);
  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Wall Details');

  // Sheet 4: Material Quantities (if available)
  if (materialReport) {
    const materialData = materialReport.byWallType.map(m => ({
      'Wall Type': m.wallTypeCode,
      'Linear Ft': m.linearFootage,
      'Square Ft': m.squareFootage,
      'Deck Height': m.deckHeight,
      'Studs (EA)': m.studs.quantity,
      'Stud Size': m.studs.size,
      'Stud Gauge': m.studs.gauge,
      'Top Track (LF)': m.topTrack.quantity,
      'Bottom Track (LF)': m.bottomTrack.quantity,
      'Drywall Sheets': m.drywall.totalSheets,
      'Drywall Type': m.drywall.type,
      'Drywall Thickness': m.drywall.thickness,
      'Layers/Side': m.drywall.layers,
      'Joint Compound (boxes)': m.jointCompound.quantity,
      'Finish Level': m.jointCompound.finishLevel,
      'Tape (rolls)': m.tape.quantity,
      'Screws (lbs)': m.screws.quantity,
      'Corner Bead (LF)': m.cornerBead.quantity,
      'Primer (gal)': m.primer.gallons,
      'Paint (gal)': m.paint.gallons,
      'Paint Type': m.paint.type,
      'Paint Coats': m.paint.coats
    }));
    const materialSheet = XLSX.utils.json_to_sheet(materialData);
    setColumnWidths(materialSheet, [12, 10, 10, 10, 10, 10, 10, 12, 14, 14, 12, 14, 12, 20, 12, 12, 12, 15, 12, 12, 12, 12]);
    XLSX.utils.book_append_sheet(workbook, materialSheet, 'Material Quantities');

    // Sheet 5: Project Totals
    const totals = materialReport.projectTotals;
    const totalsData = [
      { 'Item': 'Total Linear Footage', 'Quantity': totals.totalLinearFootage, 'Unit': 'LF' },
      { 'Item': 'Total Square Footage', 'Quantity': totals.totalSquareFootage, 'Unit': 'SF' },
      { 'Item': 'Total Studs', 'Quantity': totals.totalStuds, 'Unit': 'EA' },
      { 'Item': 'Total Track', 'Quantity': totals.totalTrackLF, 'Unit': 'LF' },
      { 'Item': 'Total Drywall Sheets', 'Quantity': totals.totalDrywallSheets, 'Unit': 'sheets' },
      { 'Item': 'Total Joint Compound', 'Quantity': totals.totalJointCompound, 'Unit': 'boxes' },
      { 'Item': 'Total Tape', 'Quantity': totals.totalTape, 'Unit': 'rolls' },
      { 'Item': 'Total Screws', 'Quantity': totals.totalScrews, 'Unit': 'lbs' },
      { 'Item': 'Total Primer', 'Quantity': totals.totalPrimerGallons, 'Unit': 'gallons' },
      { 'Item': 'Total Paint', 'Quantity': totals.totalPaintGallons, 'Unit': 'gallons' },
    ];
    const totalsSheet = XLSX.utils.json_to_sheet(totalsData);
    setColumnWidths(totalsSheet, [25, 15, 10]);
    XLSX.utils.book_append_sheet(workbook, totalsSheet, 'Project Totals');

    // Sheet 6: User Inputs Reference
    const inputs = materialReport.userInputs;
    const inputsData = [
      { 'Setting': 'Deck Height', 'Value': inputs.deckHeight, 'Unit': 'feet' },
      { 'Setting': 'Stud Gauge', 'Value': inputs.studGauge, 'Unit': 'ga' },
      { 'Setting': 'Drywall Type', 'Value': inputs.drywallType, 'Unit': '' },
      { 'Setting': 'Drywall Thickness', 'Value': inputs.drywallThickness, 'Unit': '' },
      { 'Setting': 'Finish Level', 'Value': inputs.finishLevel, 'Unit': '(0-5)' },
      { 'Setting': 'Paint Type', 'Value': inputs.paintType, 'Unit': '' },
      { 'Setting': 'Paint Coats', 'Value': inputs.paintCoats, 'Unit': 'coats' },
      { 'Setting': 'Waste Factor', 'Value': inputs.wasteFactor, 'Unit': '%' },
      { 'Setting': 'Generated At', 'Value': materialReport.generatedAt, 'Unit': '' },
    ];
    const inputsSheet = XLSX.utils.json_to_sheet(inputsData);
    setColumnWidths(inputsSheet, [20, 25, 10]);
    XLSX.utils.book_append_sheet(workbook, inputsSheet, 'Estimate Settings');
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Wall_Takeoff_${timestamp}.xlsx`;

  // Download the file
  XLSX.writeFile(workbook, filename);
}

/**
 * Set column widths for a worksheet
 */
function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]): void {
  sheet['!cols'] = widths.map(w => ({ wch: w }));
}

/**
 * Export raw takeoff data to simple CSV (fallback if xlsx fails)
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => {
        const val = row[h];
        // Escape commas and quotes
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Quick export wall type summary
 */
export function exportWallTypeSummary(
  projectName: string,
  wallTypeTotals: { typeCode: string; totalLF: number; description?: string }[]
): void {
  const data = wallTypeTotals.map(wt => ({
    'Wall Type': wt.typeCode,
    'Description': wt.description || '',
    'Total Linear Ft': wt.totalLF
  }));

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [12, 40, 15]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Wall Summary');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${projectName}_Wall_Summary_${timestamp}.xlsx`);
}

// ============================================================
// COMPREHENSIVE MULTI-SCOPE EXPORT (Template Excel Costing format)
// ============================================================

export interface TakeoffItem {
  id: string;
  plan_id: string;
  page_number: number;
  item_type: string;
  description: string;
  quantity: number;
  unit: string;
  room_name?: string;
  wall_type?: string;
  ceiling_type?: string;
  linear_footage?: number;
  wall_height?: number;
  ceiling_area_sqft?: number;
  door_material?: string;
  door_type?: string;
  door_size?: string;
  window_material?: string;
  window_size?: string;
  hardware_package?: string;
  hardware_components?: string;
  material_spec?: string;
  dimensions?: string;
  notes?: string;
}

interface GroupedByUnitType {
  unitType: string;
  items: TakeoffItem[];
}

/**
 * Export comprehensive multi-scope takeoff to Excel matching template format
 */
export function exportComprehensiveTakeoff(
  projectName: string,
  takeoffData: TakeoffItem[],
  options?: {
    includeFraming?: boolean;
    includeDFH?: boolean;
    includeKB?: boolean;
    includeCostingDetail?: boolean;
  }
): void {
  const workbook = XLSX.utils.book_new();
  const opts = {
    includeFraming: true,
    includeDFH: true,
    includeKB: true,
    includeCostingDetail: true,
    ...options
  };

  // Group items by type for processing
  const walls = takeoffData.filter(i => i.item_type === 'wall' || i.item_type?.includes('wall'));
  const doors = takeoffData.filter(i => i.item_type === 'door' || i.item_type?.includes('door'));
  const doorHardwareSets = takeoffData.filter(i => i.item_type === 'door_hardware_set');
  const windows = takeoffData.filter(i => i.item_type === 'window' || i.item_type?.includes('window'));
  const ceilings = takeoffData.filter(i => i.item_type?.includes('ceiling'));
  const millwork = takeoffData.filter(i => i.item_type?.includes('millwork'));
  const casework = takeoffData.filter(i => i.item_type?.includes('cabinet') || i.item_type?.includes('casework') || i.item_type?.includes('vanity'));
  const bathroomItems = takeoffData.filter(i => i.item_type?.includes('bathroom') || i.item_type?.includes('partition'));
  const insulation = takeoffData.filter(i => i.item_type?.includes('insulation'));
  const hardware = takeoffData.filter(i => i.item_type?.includes('hardware') && !i.item_type?.includes('door'));

  // Sheet 1: Framing Estimate
  if (opts.includeFraming) {
    const framingSheet = createFramingEstimateSheet(walls, ceilings, insulation);
    XLSX.utils.book_append_sheet(workbook, framingSheet, 'Framing Estimate');
  }

  // Sheet 2: Window-Door Schedule
  const windowDoorSheet = createWindowDoorScheduleSheet(doors, windows);
  XLSX.utils.book_append_sheet(workbook, windowDoorSheet, 'Window-Door Schedule');

  // Sheet 3: DFH Takeoff (Doors/Frames/Hardware)
  if (opts.includeDFH) {
    const dfhSheet = createDFHTakeoffSheet(doors, doorHardwareSets, millwork);
    XLSX.utils.book_append_sheet(workbook, dfhSheet, 'DFH Takeoff');
  }

  // Sheet 4: K&B Takeoff (Kitchen & Bath)
  if (opts.includeKB) {
    const kbSheet = createKBTakeoffSheet(casework, bathroomItems);
    XLSX.utils.book_append_sheet(workbook, kbSheet, 'K&B Takeoff');
  }

  // Sheet 5: Costing Detail (all items)
  if (opts.includeCostingDetail) {
    const costingSheet = createCostingDetailSheet(takeoffData);
    XLSX.utils.book_append_sheet(workbook, costingSheet, 'Costing Detail');
  }

  // Sheet 6: Labor Kit
  const laborSheet = createLaborKitSheet(takeoffData);
  XLSX.utils.book_append_sheet(workbook, laborSheet, 'Labor Kit');

  // Sheet 7: Summary by Scope
  const summarySheet = createScopeSummarySheet(takeoffData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Takeoff_${timestamp}.xlsx`;

  // Download the file
  XLSX.writeFile(workbook, filename);
}

/**
 * Create Framing Estimate sheet
 */
function createFramingEstimateSheet(
  walls: TakeoffItem[],
  ceilings: TakeoffItem[],
  insulation: TakeoffItem[]
): XLSX.WorkSheet {
  // Group walls by type
  const wallsByType = walls.reduce((acc, w) => {
    const type = w.wall_type || 'Unknown';
    if (!acc[type]) acc[type] = { totalLF: 0, count: 0, description: '' };
    acc[type].totalLF += w.linear_footage || w.quantity || 0;
    acc[type].count++;
    if (w.description && !acc[type].description) acc[type].description = w.description;
    return acc;
  }, {} as Record<string, { totalLF: number; count: number; description: string }>);

  const data = Object.entries(wallsByType).map(([type, info]) => ({
    'Wall Type': type,
    'Description': info.description,
    'QTY': info.count,
    'Linear FT': Math.round(info.totalLF * 100) / 100,
    'Material Cost': '', // To be filled by estimator
    'Cost per LF': ''
  }));

  // Add ceiling summary
  const ceilingTotal = ceilings.reduce((sum, c) => sum + (c.ceiling_area_sqft || c.quantity || 0), 0);
  if (ceilingTotal > 0) {
    data.push({
      'Wall Type': 'CEILINGS',
      'Description': `${ceilings.length} ceiling areas`,
      'QTY': ceilings.length,
      'Linear FT': Math.round(ceilingTotal),
      'Material Cost': '',
      'Cost per LF': ''
    });
  }

  // Add insulation summary
  const insulationCount = insulation.length;
  if (insulationCount > 0) {
    data.push({
      'Wall Type': 'INSULATION',
      'Description': `${insulationCount} insulation specs`,
      'QTY': insulationCount,
      'Linear FT': 0,
      'Material Cost': '',
      'Cost per LF': ''
    });
  }

  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [15, 40, 8, 12, 15, 12]);
  return sheet;
}

/**
 * Create Window-Door Schedule sheet
 */
function createWindowDoorScheduleSheet(
  doors: TakeoffItem[],
  windows: TakeoffItem[]
): XLSX.WorkSheet {
  const data: Record<string, unknown>[] = [];

  // Add doors
  doors.forEach(door => {
    const dims = door.dimensions ? JSON.parse(door.dimensions) : {};
    data.push({
      'Type': 'DOOR',
      'Mark': extractMark(door.notes) || door.description?.split(' - ')[0] || '',
      'Size': door.door_size || '',
      'Material': door.door_material || dims.material || '',
      'Type Detail': door.door_type || dims.door_type || '',
      'QTY': door.quantity || 1,
      'Hardware Set': dims.hardware_set || extractHardwareSet(door.notes) || '',
      'Frame': dims.frame_type || '',
      'Notes': extractNotesSection(door.notes)
    });
  });

  // Add windows
  windows.forEach(win => {
    const dims = win.dimensions ? JSON.parse(win.dimensions) : {};
    data.push({
      'Type': win.item_type?.includes('mulled') ? 'WINDOW (MULLED)' : 'WINDOW',
      'Mark': extractMark(win.notes) || win.description?.split(' - ')[0] || '',
      'Size': win.window_size || '',
      'Material': win.window_material || dims.material || '',
      'Type Detail': dims.type || '',
      'QTY': win.quantity || 1,
      'Hardware Set': '',
      'Frame': dims.frame_color || '',
      'Notes': dims.multi_lite ? `Multi-lite: ${dims.lite_config || 'Yes'}` : ''
    });
  });

  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [15, 10, 15, 15, 15, 8, 12, 12, 30]);
  return sheet;
}

/**
 * Create DFH Takeoff sheet (Doors/Frames/Hardware)
 */
function createDFHTakeoffSheet(
  doors: TakeoffItem[],
  hardwareSets: TakeoffItem[],
  millwork: TakeoffItem[]
): XLSX.WorkSheet {
  // Group doors by unit type
  const doorsByUnit = groupByUnitType(doors);

  const data: Record<string, unknown>[] = [];

  doorsByUnit.forEach(group => {
    const interiorDoors = group.items.filter(d => !d.notes?.toLowerCase().includes('exterior') && !d.notes?.toLowerCase().includes('entry'));
    const exteriorDoors = group.items.filter(d => d.notes?.toLowerCase().includes('exterior') || d.notes?.toLowerCase().includes('entry'));
    const fireDoors = group.items.filter(d => d.item_type === 'fire_door' || d.notes?.toLowerCase().includes('fire'));

    data.push({
      'Unit Type': group.unitType || 'Common',
      'Interior Door Qty': interiorDoors.length,
      'Interior Doors': interiorDoors.map(d => `${extractMark(d.notes) || ''}: ${d.door_size || ''}`).join('; '),
      'Fire Door Qty': fireDoors.length,
      'Fire Doors': fireDoors.map(d => `${extractMark(d.notes) || ''}: ${d.door_size || ''}`).join('; '),
      'Exterior Door Qty': exteriorDoors.length,
      'Exterior Doors': exteriorDoors.map(d => `${extractMark(d.notes) || ''}: ${d.door_size || ''}`).join('; '),
      'Hardware Sets': [...new Set(group.items.map(d => extractHardwareSet(d.notes)).filter(Boolean))].join(', ')
    });
  });

  // Add hardware sets detail
  if (hardwareSets.length > 0) {
    data.push({ 'Unit Type': '', 'Interior Door Qty': '', 'Interior Doors': '', 'Fire Door Qty': '', 'Fire Doors': '', 'Exterior Door Qty': '', 'Exterior Doors': '', 'Hardware Sets': '' });
    data.push({ 'Unit Type': 'HARDWARE SETS', 'Interior Door Qty': '', 'Interior Doors': '', 'Fire Door Qty': '', 'Fire Doors': '', 'Exterior Door Qty': '', 'Exterior Doors': '', 'Hardware Sets': '' });

    hardwareSets.forEach(hw => {
      const components = hw.hardware_components ? JSON.parse(hw.hardware_components) : {};
      data.push({
        'Unit Type': hw.hardware_package || hw.description?.split(' - ')[0] || '',
        'Interior Door Qty': '',
        'Interior Doors': `Lock: ${components.lockset_function || components.lockset_type || 'N/A'}`,
        'Fire Door Qty': '',
        'Fire Doors': `Hinge: ${components.hinge_type || 'N/A'} x${components.hinge_qty || 0}`,
        'Exterior Door Qty': '',
        'Exterior Doors': `Closer: ${components.closer_type || 'N/A'}`,
        'Hardware Sets': `${components.manufacturer || ''} ${components.finish || ''}`
      });
    });
  }

  // Add trim/millwork section
  if (millwork.length > 0) {
    data.push({ 'Unit Type': '', 'Interior Door Qty': '', 'Interior Doors': '', 'Fire Door Qty': '', 'Fire Doors': '', 'Exterior Door Qty': '', 'Exterior Doors': '', 'Hardware Sets': '' });
    data.push({ 'Unit Type': 'TRIM/MILLWORK', 'Interior Door Qty': 'QTY', 'Interior Doors': 'Type', 'Fire Door Qty': '', 'Fire Doors': 'Material', 'Exterior Door Qty': '', 'Exterior Doors': '', 'Hardware Sets': '' });

    millwork.forEach(mw => {
      data.push({
        'Unit Type': mw.room_name || '',
        'Interior Door Qty': mw.quantity || mw.linear_footage || 0,
        'Interior Doors': mw.item_type?.replace('millwork_', '') || 'trim',
        'Fire Door Qty': '',
        'Fire Doors': mw.material_spec || '',
        'Exterior Door Qty': '',
        'Exterior Doors': '',
        'Hardware Sets': ''
      });
    });
  }

  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [15, 15, 35, 12, 30, 15, 30, 25]);
  return sheet;
}

/**
 * Create K&B Takeoff sheet (Kitchen & Bath)
 */
function createKBTakeoffSheet(
  casework: TakeoffItem[],
  bathroomItems: TakeoffItem[]
): XLSX.WorkSheet {
  const data: Record<string, unknown>[] = [];

  // Kitchen cabinets
  const kitchenCabinets = casework.filter(c => c.item_type?.includes('kitchen') || c.room_name?.toLowerCase().includes('kitchen'));
  if (kitchenCabinets.length > 0) {
    data.push({ 'Category': 'KITCHEN CABINETS', 'Type': '', 'Size': '', 'Material': '', 'QTY': '', 'Notes': '' });

    kitchenCabinets.forEach(cab => {
      const dims = cab.dimensions ? JSON.parse(cab.dimensions) : {};
      data.push({
        'Category': cab.room_name || 'Kitchen',
        'Type': cab.item_type?.replace('kitchen_', '') || 'Cabinet',
        'Size': dims.size || '',
        'Material': cab.material_spec || dims.material || '',
        'QTY': cab.quantity || 1,
        'Notes': `Style: ${dims.door_style || 'N/A'} | Finish: ${dims.finish || 'N/A'} | Hardware: ${dims.hardware || 'N/A'}`
      });
    });
  }

  // Bathroom vanities
  const bathVanities = casework.filter(c => c.item_type?.includes('vanity') || c.item_type?.includes('bathroom') || c.room_name?.toLowerCase().includes('bath'));
  if (bathVanities.length > 0) {
    data.push({ 'Category': '', 'Type': '', 'Size': '', 'Material': '', 'QTY': '', 'Notes': '' });
    data.push({ 'Category': 'BATHROOM VANITIES', 'Type': '', 'Size': '', 'Material': '', 'QTY': '', 'Notes': '' });

    bathVanities.forEach(van => {
      const dims = van.dimensions ? JSON.parse(van.dimensions) : {};
      data.push({
        'Category': van.room_name || 'Bathroom',
        'Type': 'Vanity',
        'Size': dims.size || '',
        'Material': van.material_spec || dims.material || '',
        'QTY': van.quantity || 1,
        'Notes': `Countertop: ${dims.countertop || 'N/A'}`
      });
    });
  }

  // Bathroom partitions
  const partitions = bathroomItems.filter(b => b.item_type?.includes('partition'));
  if (partitions.length > 0) {
    data.push({ 'Category': '', 'Type': '', 'Size': '', 'Material': '', 'QTY': '', 'Notes': '' });
    data.push({ 'Category': 'BATHROOM PARTITIONS', 'Type': '', 'Size': '', 'Material': '', 'QTY': '', 'Notes': '' });

    partitions.forEach(part => {
      const dims = part.dimensions ? JSON.parse(part.dimensions) : {};
      data.push({
        'Category': part.room_name || 'Restroom',
        'Type': dims.type || 'Partition',
        'Size': `Stalls: ${dims.stall_count || 0} | Screens: ${dims.urinal_screen_count || 0}`,
        'Material': `${dims.material || ''} ${dims.core || ''}`.trim(),
        'QTY': part.quantity || 1,
        'Notes': `Mfr: ${dims.manufacturer || 'TBD'} | Color: ${dims.color || 'TBD'}`
      });
    });
  }

  // Bathroom accessories
  const accessories = bathroomItems.filter(b => b.item_type?.includes('accessory'));
  if (accessories.length > 0) {
    data.push({ 'Category': '', 'Type': '', 'Size': '', 'Material': '', 'QTY': '', 'Notes': '' });
    data.push({ 'Category': 'BATHROOM ACCESSORIES', 'Type': '', 'Size': '', 'Material': '', 'QTY': '', 'Notes': '' });

    accessories.forEach(acc => {
      const dims = acc.dimensions ? JSON.parse(acc.dimensions) : {};
      data.push({
        'Category': acc.room_name || '',
        'Type': dims.item_type || acc.description?.split(' - ')[0] || 'Accessory',
        'Size': '',
        'Material': acc.material_spec || dims.material || '',
        'QTY': acc.quantity || 1,
        'Notes': `Mfr: ${dims.manufacturer || 'TBD'} | Model: ${dims.model || 'N/A'} | ADA: ${dims.ada_compliant ? 'Yes' : 'No'}`
      });
    });
  }

  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [20, 15, 20, 20, 8, 50]);
  return sheet;
}

/**
 * Create Costing Detail sheet (all items)
 */
function createCostingDetailSheet(takeoffData: TakeoffItem[]): XLSX.WorkSheet {
  const data = takeoffData.map(item => ({
    'Type Detail': item.item_type || '',
    'Type': categorizeItemType(item.item_type),
    'Location': item.room_name || '',
    'Description Detail': item.description || '',
    'QTY': item.quantity || 0,
    'UoM': item.unit || 'EA',
    'Cost per UOM': '', // To be filled by estimator
    'Total Cost': ''    // Formula or manual entry
  }));

  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [20, 15, 20, 50, 10, 8, 12, 12]);
  return sheet;
}

/**
 * Create Labor Kit sheet
 */
function createLaborKitSheet(takeoffData: TakeoffItem[]): XLSX.WorkSheet {
  const data = takeoffData.map(item => ({
    'Type': categorizeItemType(item.item_type),
    'Location': item.room_name || '',
    'Name': item.description?.split(' - ')[0] || '',
    'Description': item.description || '',
    'QTY': item.quantity || 0,
    'Labor to Install': '', // To be filled
    'Total Labor Cost': ''  // Formula
  }));

  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [15, 20, 20, 40, 10, 15, 15]);
  return sheet;
}

/**
 * Create Summary by Scope sheet
 */
function createScopeSummarySheet(takeoffData: TakeoffItem[]): XLSX.WorkSheet {
  const scopeCounts: Record<string, { count: number; totalQty: number }> = {};

  takeoffData.forEach(item => {
    const scope = categorizeItemType(item.item_type);
    if (!scopeCounts[scope]) {
      scopeCounts[scope] = { count: 0, totalQty: 0 };
    }
    scopeCounts[scope].count++;
    scopeCounts[scope].totalQty += item.quantity || 1;
  });

  const data = Object.entries(scopeCounts).map(([scope, info]) => ({
    'Scope': scope,
    'Line Items': info.count,
    'Total Quantity': Math.round(info.totalQty * 100) / 100
  }));

  // Add total row
  const totalItems = data.reduce((sum, d) => sum + d['Line Items'], 0);
  data.push({
    'Scope': 'TOTAL',
    'Line Items': totalItems,
    'Total Quantity': 0
  });

  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [25, 15, 15]);
  return sheet;
}

// Helper functions

function extractMark(notes?: string): string {
  if (!notes) return '';
  const match = notes.match(/Mark:\s*([^\s|]+)/i);
  return match ? match[1] : '';
}

function extractHardwareSet(notes?: string): string {
  if (!notes) return '';
  const match = notes.match(/HW Set:\s*([^\s|]+)/i);
  return match ? match[1] : '';
}

function extractNotesSection(notes?: string): string {
  if (!notes) return '';
  // Return truncated notes without the structured prefix parts
  const cleaned = notes.replace(/Mark:\s*[^\s|]+\s*\|?\s*/gi, '')
    .replace(/Type:\s*[^\s|]+\s*\|?\s*/gi, '')
    .replace(/Material:\s*[^\s|]+\s*\|?\s*/gi, '')
    .trim();
  return cleaned.substring(0, 100);
}

function groupByUnitType(items: TakeoffItem[]): GroupedByUnitType[] {
  const groups: Record<string, TakeoffItem[]> = {};

  items.forEach(item => {
    // Extract unit type from notes
    const unitTypeMatch = item.notes?.match(/Unit:\s*([^\s|]+)/i);
    const unitType = unitTypeMatch ? unitTypeMatch[1] : 'Common';

    if (!groups[unitType]) groups[unitType] = [];
    groups[unitType].push(item);
  });

  return Object.entries(groups).map(([unitType, items]) => ({ unitType, items }));
}

function categorizeItemType(itemType?: string): string {
  if (!itemType) return 'Other';

  const type = itemType.toLowerCase();

  if (type.includes('wall') || type.includes('framing') || type.includes('stud')) return 'Framing';
  if (type.includes('ceiling') || type.includes('act') || type.includes('acoustical')) return 'Ceilings';
  if (type.includes('drywall') || type.includes('sheathing')) return 'Drywall';
  if (type.includes('door') || type.includes('frame')) return 'Doors/Frames';
  if (type.includes('hardware') && !type.includes('door')) return 'Hardware';
  if (type.includes('window')) return 'Windows';
  if (type.includes('insulation')) return 'Insulation';
  if (type.includes('millwork') || type.includes('trim') || type.includes('casing')) return 'Millwork';
  if (type.includes('cabinet') || type.includes('casework') || type.includes('vanity')) return 'Casework';
  if (type.includes('partition')) return 'Bath Partitions';
  if (type.includes('accessory')) return 'Bath Accessories';
  if (type.includes('beam') || type.includes('header')) return 'Structural';
  if (type.includes('soffit')) return 'Soffits';
  if (type.includes('seismic')) return 'Seismic';

  return 'Other';
}

// ============================================================
// QUICKBID EXPORT
// ============================================================

/**
 * Export takeoff data to QuickBid CSV format
 */
export function exportToQuickBid(projectName: string, takeoffData: TakeoffItem[]): void {
  // QuickBid CSV format: Item Code, Description, Quantity, Unit, Cost Code, Phase
  const data = takeoffData.map(item => ({
    'Item Code': item.item_type?.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 10) || 'MISC',
    'Description': item.description || '',
    'Quantity': item.quantity || 0,
    'Unit': item.unit || 'EA',
    'Cost Code': getCostCode(item.item_type),
    'Phase': extractPhase(item.notes),
    'Location': item.room_name || '',
    'Notes': item.notes?.substring(0, 200) || ''
  }));

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(sheet, [12, 50, 10, 8, 12, 10, 20, 50]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'QuickBid Import');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_QuickBid_${timestamp}.csv`);
}

// ============================================================
// BUILDERTREND EXPORT
// ============================================================

/**
 * Export takeoff data to Buildertrend format
 */
export function exportToBuildertrend(projectName: string, takeoffData: TakeoffItem[]): void {
  // Buildertrend format: Category, Item, Description, Qty, Unit, Unit Cost, Total
  const data = takeoffData.map(item => ({
    'Category': categorizeItemType(item.item_type),
    'Item': item.description?.split(' - ')[0] || item.item_type || '',
    'Description': item.description || '',
    'Qty': item.quantity || 0,
    'Unit': item.unit || 'EA',
    'Unit Cost': '', // To be filled by user
    'Total': '', // Formula
    'Location': item.room_name || '',
    'Phase': extractPhase(item.notes),
    'Vendor': '', // To be filled by user
    'Notes': item.notes?.substring(0, 150) || ''
  }));

  const workbook = XLSX.utils.book_new();

  // Main takeoff sheet
  const takeoffSheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(takeoffSheet, [15, 30, 50, 10, 8, 12, 12, 20, 10, 20, 40]);
  XLSX.utils.book_append_sheet(workbook, takeoffSheet, 'Takeoff Import');

  // Summary sheet by category
  const categorySummary: Record<string, { count: number; totalQty: number }> = {};
  takeoffData.forEach(item => {
    const cat = categorizeItemType(item.item_type);
    if (!categorySummary[cat]) categorySummary[cat] = { count: 0, totalQty: 0 };
    categorySummary[cat].count++;
    categorySummary[cat].totalQty += item.quantity || 1;
  });

  const summaryData = Object.entries(categorySummary).map(([cat, info]) => ({
    'Category': cat,
    'Line Items': info.count,
    'Total Qty': Math.round(info.totalQty * 100) / 100,
    'Budget': '', // To be filled
    'Actual': '' // To be filled
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  setColumnWidths(summarySheet, [20, 12, 12, 15, 15]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Budget Summary');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_Buildertrend_${timestamp}.xlsx`);
}

// ============================================================
// QUICKBOOKS EXPORT
// ============================================================

/**
 * Export takeoff data to QuickBooks IIF format
 */
export function exportToQuickBooks(projectName: string, takeoffData: TakeoffItem[]): void {
  // QuickBooks import format with job costing
  const data = takeoffData.map((item, idx) => ({
    'Trans #': idx + 1,
    'Item': item.description?.split(' - ')[0] || item.item_type || 'Item',
    'Description': item.description || '',
    'Qty': item.quantity || 0,
    'Unit': item.unit || 'EA',
    'Rate': '', // Cost per unit - to be filled
    'Amount': '', // Total - formula
    'Customer:Job': projectName,
    'Class': categorizeItemType(item.item_type),
    'Service Date': new Date().toLocaleDateString(),
    'Billable': 'Y',
    'Taxable': 'Y'
  }));

  const workbook = XLSX.utils.book_new();

  // Items sheet
  const itemsSheet = XLSX.utils.json_to_sheet(data);
  setColumnWidths(itemsSheet, [10, 30, 50, 10, 8, 12, 12, 30, 15, 12, 10, 10]);
  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items');

  // Expense categories sheet for job costing
  const categories = [...new Set(takeoffData.map(item => categorizeItemType(item.item_type)))];
  const categoryData = categories.map(cat => ({
    'Account': `Job Expenses:${cat}`,
    'Type': 'Expense',
    'Description': `${cat} materials and labor for ${projectName}`
  }));

  const categorySheet = XLSX.utils.json_to_sheet(categoryData);
  setColumnWidths(categorySheet, [30, 15, 50]);
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Expense Accounts');

  // Labor summary
  const laborData = categories.map(cat => {
    const items = takeoffData.filter(i => categorizeItemType(i.item_type) === cat);
    return {
      'Category': cat,
      'Item Count': items.length,
      'Est Labor Hours': '', // To be filled
      'Labor Rate': '', // To be filled
      'Labor Total': '' // Formula
    };
  });

  const laborSheet = XLSX.utils.json_to_sheet(laborData);
  setColumnWidths(laborSheet, [20, 12, 15, 12, 12]);
  XLSX.utils.book_append_sheet(workbook, laborSheet, 'Labor Estimate');

  const timestamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_QuickBooks_${timestamp}.xlsx`);
}

// Helper functions for exports

function getCostCode(itemType?: string): string {
  if (!itemType) return '000';
  const type = itemType.toLowerCase();

  // CSI Division codes
  if (type.includes('concrete')) return '03';
  if (type.includes('masonry')) return '04';
  if (type.includes('metal') || type.includes('steel')) return '05';
  if (type.includes('wood') || type.includes('framing')) return '06';
  if (type.includes('insulation') || type.includes('thermal')) return '07';
  if (type.includes('door')) return '08';
  if (type.includes('window')) return '08';
  if (type.includes('drywall') || type.includes('gypsum')) return '09';
  if (type.includes('ceiling') || type.includes('act')) return '09';
  if (type.includes('flooring') || type.includes('tile')) return '09';
  if (type.includes('paint') || type.includes('coating')) return '09';
  if (type.includes('cabinet') || type.includes('casework')) return '12';
  if (type.includes('partition') || type.includes('bathroom')) return '10';
  if (type.includes('accessory')) return '10';

  return '01'; // General requirements
}

function extractPhase(notes?: string): string {
  if (!notes) return '1';
  const phaseMatch = notes.match(/Phase:\s*(\d+|[A-Za-z]+)/i);
  return phaseMatch ? phaseMatch[1] : '1';
}
