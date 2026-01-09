/**
 * Wall Material Calculator
 * Calculates material quantities for drywall estimating based on wall takeoff data
 */

export interface WallTypeSpec {
  typeCode: string;
  description: string;
  studSize: string; // e.g., "3-5/8", "6"
  studSpacing: number; // in inches, e.g., 16, 24
  studGauge: number; // e.g., 20, 25
  layersEachSide: number;
  drywallType: string; // "regular", "type_x", "moisture_resistant", "abuse_resistant"
  drywallThickness: string; // "1/2", "5/8"
  fireRating: string | null;
  insulation: boolean;
  insulationType?: string;
}

export interface WallInput {
  wallTypeCode: string;
  linearFootage: number;
  deckHeight: number; // in feet
}

export interface UserInputs {
  deckHeight: number; // feet
  studGauge: number; // 20, 25, etc.
  drywallType: string;
  drywallThickness: string;
  finishLevel: number; // 0-5
  paintType: string;
  paintCoats: number;
  insulationType?: string;
  wasteFactor: number; // percentage, e.g., 10 for 10%
}

export interface MaterialQuantities {
  wallTypeCode: string;
  linearFootage: number;
  squareFootage: number;
  deckHeight: number;

  // Framing
  studs: {
    quantity: number;
    size: string;
    gauge: number;
    unit: string;
  };
  topTrack: {
    quantity: number;
    size: string;
    gauge: number;
    unit: string; // LF
  };
  bottomTrack: {
    quantity: number;
    size: string;
    gauge: number;
    unit: string; // LF
  };

  // Drywall
  drywall: {
    sheets4x8: number;
    sheets4x10: number;
    sheets4x12: number;
    totalSheets: number;
    type: string;
    thickness: string;
    layers: number;
    unit: string;
  };

  // Finishing
  jointCompound: {
    quantity: number;
    unit: string; // boxes or buckets
    finishLevel: number;
  };
  tape: {
    quantity: number;
    unit: string; // rolls
  };
  screws: {
    quantity: number;
    unit: string; // lbs or boxes
  };
  cornerBead: {
    quantity: number;
    unit: string; // LF
  };

  // Paint
  paint: {
    gallons: number;
    type: string;
    coats: number;
    coveragePerGallon: number;
  };
  primer: {
    gallons: number;
    coveragePerGallon: number;
  };

  // Insulation (if applicable)
  insulation?: {
    squareFootage: number;
    type: string;
    unit: string;
  };
}

export interface WallMaterialReport {
  projectTotals: {
    totalLinearFootage: number;
    totalSquareFootage: number;
    totalStuds: number;
    totalTrackLF: number;
    totalDrywallSheets: number;
    totalJointCompound: number;
    totalTape: number;
    totalScrews: number;
    totalPaintGallons: number;
    totalPrimerGallons: number;
  };
  byWallType: MaterialQuantities[];
  userInputs: UserInputs;
  generatedAt: string;
}

// Standard stud heights available
const STUD_HEIGHTS = [8, 9, 10, 12, 14, 16]; // feet

// Drywall sheet sizes
const DRYWALL_SHEETS = {
  '4x8': { width: 4, height: 8, sqft: 32 },
  '4x10': { width: 4, height: 10, sqft: 40 },
  '4x12': { width: 4, height: 12, sqft: 48 },
};

// Coverage rates
const COVERAGE = {
  jointCompound: {
    level0: 0,      // No finishing
    level1: 0.05,   // boxes per SF (fire tape only)
    level2: 0.08,   // boxes per SF
    level3: 0.10,   // boxes per SF
    level4: 0.12,   // boxes per SF (standard)
    level5: 0.15,   // boxes per SF (smooth wall)
  },
  tape: 0.01,       // rolls per SF
  screws: 0.015,    // lbs per SF
  paint: 350,       // SF per gallon
  primer: 400,      // SF per gallon
};

/**
 * Calculate materials needed for a single wall type
 */
export function calculateWallMaterials(
  wall: WallInput,
  spec: WallTypeSpec,
  userInputs: UserInputs
): MaterialQuantities {
  const deckHeight = userInputs.deckHeight || wall.deckHeight || 10;
  const linearFt = wall.linearFootage;
  const wasteFactor = 1 + (userInputs.wasteFactor / 100);

  // Square footage (one side)
  const sqftOneSide = linearFt * deckHeight;
  // Total SF including both sides
  const totalSqft = sqftOneSide * 2;

  // Stud calculation
  const studSpacing = spec.studSpacing || 16;
  const studsPerLF = 12 / studSpacing; // studs per linear foot
  const totalStuds = Math.ceil(linearFt * studsPerLF * wasteFactor) + Math.ceil(linearFt / 10); // +1 per 10 LF for corners/intersections

  // Track (top and bottom)
  const trackLF = linearFt * wasteFactor;

  // Drywall sheets calculation
  const layers = spec.layersEachSide || 1;
  const totalDrywallSqft = totalSqft * layers * wasteFactor;

  // Determine optimal sheet size based on deck height
  let primarySheetSize: '4x8' | '4x10' | '4x12' = '4x8';
  if (deckHeight > 10) primarySheetSize = '4x12';
  else if (deckHeight > 8) primarySheetSize = '4x10';

  const sheetSqft = DRYWALL_SHEETS[primarySheetSize].sqft;
  const totalSheets = Math.ceil(totalDrywallSqft / sheetSqft);

  // Finishing materials
  const finishLevel = userInputs.finishLevel || 4;
  const compoundRate = COVERAGE.jointCompound[`level${finishLevel}` as keyof typeof COVERAGE.jointCompound] || 0.12;
  const jointCompound = Math.ceil(totalDrywallSqft * compoundRate);
  const tape = Math.ceil(totalDrywallSqft * COVERAGE.tape);
  const screws = Math.ceil(totalDrywallSqft * COVERAGE.screws);

  // Corner bead (estimate 1 LF per 20 SF for corners)
  const cornerBead = Math.ceil(totalSqft / 20);

  // Paint calculation
  const paintableSqft = totalSqft; // Both sides
  const paintGallons = Math.ceil((paintableSqft * userInputs.paintCoats) / COVERAGE.paint);
  const primerGallons = Math.ceil(paintableSqft / COVERAGE.primer);

  // Insulation
  const insulation = spec.insulation ? {
    squareFootage: Math.ceil(sqftOneSide * wasteFactor),
    type: userInputs.insulationType || spec.insulationType || 'batt',
    unit: 'SF'
  } : undefined;

  return {
    wallTypeCode: wall.wallTypeCode,
    linearFootage: linearFt,
    squareFootage: totalSqft,
    deckHeight,

    studs: {
      quantity: totalStuds,
      size: spec.studSize || '3-5/8"',
      gauge: userInputs.studGauge || 25,
      unit: 'EA'
    },
    topTrack: {
      quantity: Math.ceil(trackLF),
      size: spec.studSize || '3-5/8"',
      gauge: userInputs.studGauge || 25,
      unit: 'LF'
    },
    bottomTrack: {
      quantity: Math.ceil(trackLF),
      size: spec.studSize || '3-5/8"',
      gauge: userInputs.studGauge || 25,
      unit: 'LF'
    },

    drywall: {
      sheets4x8: primarySheetSize === '4x8' ? totalSheets : 0,
      sheets4x10: primarySheetSize === '4x10' ? totalSheets : 0,
      sheets4x12: primarySheetSize === '4x12' ? totalSheets : 0,
      totalSheets,
      type: userInputs.drywallType || spec.drywallType || 'regular',
      thickness: userInputs.drywallThickness || spec.drywallThickness || '5/8"',
      layers,
      unit: 'sheets'
    },

    jointCompound: {
      quantity: jointCompound,
      unit: 'boxes',
      finishLevel
    },
    tape: {
      quantity: tape,
      unit: 'rolls'
    },
    screws: {
      quantity: screws,
      unit: 'lbs'
    },
    cornerBead: {
      quantity: cornerBead,
      unit: 'LF'
    },

    paint: {
      gallons: paintGallons,
      type: userInputs.paintType || 'latex',
      coats: userInputs.paintCoats || 2,
      coveragePerGallon: COVERAGE.paint
    },
    primer: {
      gallons: primerGallons,
      coveragePerGallon: COVERAGE.primer
    },

    insulation
  };
}

/**
 * Generate full material report for all wall types
 */
export function generateMaterialReport(
  walls: WallInput[],
  wallSpecs: Map<string, WallTypeSpec>,
  userInputs: UserInputs
): WallMaterialReport {
  const byWallType: MaterialQuantities[] = [];

  // Group walls by type and sum linear footage
  const wallsByType = new Map<string, number>();
  for (const wall of walls) {
    const current = wallsByType.get(wall.wallTypeCode) || 0;
    wallsByType.set(wall.wallTypeCode, current + wall.linearFootage);
  }

  // Calculate materials for each wall type
  for (const [typeCode, totalLF] of wallsByType) {
    const spec = wallSpecs.get(typeCode) || getDefaultWallSpec(typeCode);
    const materials = calculateWallMaterials(
      { wallTypeCode: typeCode, linearFootage: totalLF, deckHeight: userInputs.deckHeight },
      spec,
      userInputs
    );
    byWallType.push(materials);
  }

  // Calculate project totals
  const projectTotals = {
    totalLinearFootage: byWallType.reduce((sum, w) => sum + w.linearFootage, 0),
    totalSquareFootage: byWallType.reduce((sum, w) => sum + w.squareFootage, 0),
    totalStuds: byWallType.reduce((sum, w) => sum + w.studs.quantity, 0),
    totalTrackLF: byWallType.reduce((sum, w) => sum + w.topTrack.quantity + w.bottomTrack.quantity, 0),
    totalDrywallSheets: byWallType.reduce((sum, w) => sum + w.drywall.totalSheets, 0),
    totalJointCompound: byWallType.reduce((sum, w) => sum + w.jointCompound.quantity, 0),
    totalTape: byWallType.reduce((sum, w) => sum + w.tape.quantity, 0),
    totalScrews: byWallType.reduce((sum, w) => sum + w.screws.quantity, 0),
    totalPaintGallons: byWallType.reduce((sum, w) => sum + w.paint.gallons, 0),
    totalPrimerGallons: byWallType.reduce((sum, w) => sum + w.primer.gallons, 0),
  };

  return {
    projectTotals,
    byWallType,
    userInputs,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Default wall spec when legend info is not available
 */
function getDefaultWallSpec(typeCode: string): WallTypeSpec {
  return {
    typeCode,
    description: `Wall Type ${typeCode}`,
    studSize: '3-5/8"',
    studSpacing: 16,
    studGauge: 25,
    layersEachSide: 1,
    drywallType: 'regular',
    drywallThickness: '5/8"',
    fireRating: null,
    insulation: false
  };
}

/**
 * Parse wall materials JSON from database
 */
export function parseWallMaterials(wallMaterialsJson: string | null): Partial<WallTypeSpec> {
  if (!wallMaterialsJson) return {};
  try {
    return JSON.parse(wallMaterialsJson);
  } catch {
    return {};
  }
}
