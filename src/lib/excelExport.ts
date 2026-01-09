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
