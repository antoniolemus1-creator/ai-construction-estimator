# AI Construction Extraction Training Guide

## Overview
This guide trains the AI system on how to properly read and extract data from construction drawings and specifications for multi-family and commercial projects.

---

## Sheet Types and What to Extract

### A-Series (Architectural)
| Sheet | Content | Extract |
|-------|---------|---------|
| A0.01 | Cover, Index | Project name, sheet list |
| A1.xx | Floor Plans | Walls, doors, windows, room names/numbers |
| A2.xx | Exterior Elevations | Window locations, materials |
| A3.xx | Building Sections | Heights, floor-to-floor dimensions |
| A4.xx | Wall Sections | Wall types, assembly details |
| A5.xx | Details | Material specs, dimensions |
| A6.xx | Schedules | Door/Window/Finish schedules |
| A7.xx | Reflected Ceiling Plans | Ceiling types, heights, areas |
| A8.xx | Interior Elevations | Cabinets, trim, millwork |

### ID-Series (Interior Design)
| Sheet | Content | Extract |
|-------|---------|---------|
| ID1.xx | Floor Plans | Room finishes, furniture |
| ID2.xx | Finish Plans | Floor/wall/ceiling finishes |
| ID3.xx | Ceiling Plans | ACT, drywall, specialty |
| ID4.xx | Elevations | Cabinets, millwork details |

### S-Series (Structural)
| Sheet | Content | Extract |
|-------|---------|---------|
| S1.xx | Foundation | N/A for interior takeoff |
| S2.xx | Framing Plans | Beam/header locations |
| S3.xx | Details | Hardware, connectors |

---

## How to Read Wall Types

### Wall Type Notation
Walls are typically labeled with codes like:
- **A** = Type A wall assembly
- **B1** = Type B1 wall assembly
- **EXT-1** = Exterior wall type 1

### Wall Type Legend Components
```
TYPE A: 3-5/8" METAL STUDS @ 16" O.C., 1 LAYER 5/8" GYP. BD. EACH SIDE
        STC 45, 1-HR FIRE RATING, UL U465
```

Extract:
- Stud size: 3-5/8"
- Stud spacing: 16" O.C.
- Drywall: 1 layer 5/8" each side
- STC rating: 45
- Fire rating: 1-HR
- UL number: U465

### Measuring Wall Linear Footage
1. Look for dimension strings on plans
2. Scale from drawing if dimensions missing
3. Include ALL wall segments of each type
4. Note: Curved walls = arc length

---

## How to Read Door Schedules

### Door Schedule Format
```
MARK | WIDTH | HEIGHT | THK | TYPE | FRAME | HDWR | RATING | REMARKS
101  | 3'-0" | 7'-0"  | 1¾" | A    | B     | 1    | -      | WOOD FLUSH
102  | 3'-0" | 7'-0"  | 1¾" | B    | A     | 2    | 20 MIN | HM FLUSH
```

### Door Type Codes
- **A** = Wood flush solid core
- **B** = Hollow metal (HM)
- **C** = Glass/aluminum storefront
- **D** = Wood panel
- **E** = Fire-rated

### Frame Type Codes
- **A** = Hollow metal, welded
- **B** = Hollow metal, knockdown
- **C** = Wood
- **D** = Aluminum

### Hardware Set Reference
- Links to hardware schedule/specs
- Typically numbered 1, 2, 3, etc.
- Contains lockset, hinges, closer, stops

---

## How to Read Window Schedules

### Window Schedule Format
```
MARK | WIDTH | HEIGHT | TYPE | FRAME | GLAZING | REMARKS
W1   | 4'-0" | 5'-0"  | FX   | AL    | IG/LOW-E| FIXED
W2   | 3'-0" | 4'-0"  | DH   | VNL   | IG      | DOUBLE HUNG
```

### Window Type Codes
- **FX** = Fixed
- **DH** = Double Hung
- **SH** = Single Hung
- **CS** = Casement
- **AW** = Awning
- **SL** = Slider

### Glazing Codes
- **IG** = Insulated Glass
- **LOW-E** = Low emissivity coating
- **TMP** = Tempered
- **LAM** = Laminated

---

## How to Read Ceiling Plans (RCP)

### Ceiling Symbols
- **GYP** or **GWB** = Gypsum wallboard (drywall)
- **ACT** or **ACST** = Acoustical ceiling tile
- **2x2** or **2x4** = ACT grid size
- **CLG HT 9'-0"** = Ceiling height

### Ceiling Type Legend
```
TYPE 1: 5/8" GYP. BD. ON FURRING, PAINTED
TYPE 2: 2x2 ACT IN SUSPENDED GRID, ARMSTRONG #770
TYPE 3: 5/8" GYP. BD., LEVEL 5 FINISH, 1-HR RATED
```

### Calculate Ceiling Areas
1. Get room dimensions from floor plan
2. Calculate SF = Length × Width
3. Get perimeter LF for edge trim
4. Note ceiling height for each room

---

## How to Read Finish Schedules

### Room Finish Schedule Format
```
ROOM | FLOOR | BASE | WALLS | CEILING | HT  | REMARKS
101  | CT-1  | RB-1 | PT-1  | GYP-1   | 9'-0"| LOBBY
102  | CPT-2 | RB-2 | PT-2  | ACT-1   | 8'-6"| OFFICE
```

### Finish Codes
**Floors:**
- CT = Ceramic Tile
- CPT = Carpet
- VCT = Vinyl Composition Tile
- LVT = Luxury Vinyl Tile
- CONC = Sealed Concrete

**Base:**
- RB = Rubber Base
- WB = Wood Base
- TB = Tile Base
- CB = Cove Base

**Walls:**
- PT = Paint
- WC = Wallcovering
- CT = Ceramic Tile
- FRP = Fiberglass Reinforced Panel

---

## How to Read Cabinet Elevations

### Kitchen Cabinet Notation
```
B24 = Base cabinet 24" wide
W3015 = Wall cabinet 30" wide × 15" high
T84 = Tall cabinet 84" high
```

### Extract from Elevations
1. **Base cabinets**: Measure total LF
2. **Wall cabinets**: Measure total LF
3. **Countertop**: Base LF + overhangs
4. **Backsplash**: Wall cabinet LF × height

### Standard Dimensions
- Base cabinet depth: 24"
- Base cabinet height: 34.5"
- Wall cabinet depth: 12"
- Wall cabinet height: 30", 36", or 42"
- Countertop height: 36" AFF

---

## How to Read Trim Details

### Base Trim
- Look in finish schedule or details
- Common heights: 3", 4", 5.25"
- Calculate LF = room perimeter - door widths

### Door Casing
- Standard: ~17 LF per door opening
- 2 sides × 7' + 1 head × 3' = 17 LF
- Check for double/triple trim profiles

### Window Casing
- Similar to door casing
- Calculate per window: 2×H + W + sill

### Crown Molding
- Check interior elevations
- Usually in formal spaces only
- Calculate room perimeter at ceiling

---

## CSI MasterFormat Divisions

### Relevant Divisions for Interior Takeoff
| Div | Name | Items |
|-----|------|-------|
| 06 | Wood, Plastics, Composites | Millwork, trim, blocking |
| 08 | Openings | Doors, frames, hardware, windows |
| 09 | Finishes | Drywall, ACT, paint, flooring |
| 10 | Specialties | Toilet accessories, signage |
| 12 | Furnishings | Cabinets, countertops |

---

## Common Symbols Reference

### Plan Symbols
- **→** or arrow in circle = North arrow
- **△** with number = Section cut
- **○** with number = Detail reference
- **□** with X = Column
- **Dashed line** = Above items (cabinets, soffits)

### Door Symbols
- Arc shows swing direction
- 90° = standard swing
- Pocket = slides into wall
- Bi-fold = accordion style

### Wall Symbols
- **Solid fill** = Existing wall
- **Hatched** = New construction
- **Dotted** = Demo

---

## Confidence Scoring Guidelines

### High Confidence (90-100)
- Item clearly labeled with dimensions
- Appears in schedule with complete info
- Consistent across multiple sheets

### Good Confidence (70-89)
- Item visible but some interpretation needed
- Partial information in schedule
- Dimensions can be scaled

### Moderate Confidence (50-69)
- Item implied but not explicitly shown
- Must cross-reference multiple sources
- Standard assumptions applied

### Low Confidence (30-49)
- Significant assumptions made
- Information incomplete or unclear
- Requires verification

### Very Low Confidence (0-29)
- Educated guess only
- Contradictory information
- Recommend re-extraction or RFI

---

## Cross-Reference Checklist

For complete takeoff, cross-reference:

1. **Doors**
   - [ ] Floor plans (locations, swing direction)
   - [ ] Door schedule (sizes, types)
   - [ ] Hardware schedule/specs (locksets, hinges)
   - [ ] Fire rating plans (rated doors)

2. **Windows**
   - [ ] Floor plans (locations)
   - [ ] Exterior elevations (head heights)
   - [ ] Window schedule (sizes, types)
   - [ ] Specifications (manufacturers)

3. **Walls**
   - [ ] Floor plans (locations, lengths)
   - [ ] Wall type legend (assembly details)
   - [ ] Sections (heights)
   - [ ] Fire rating plans (rated walls)

4. **Ceilings**
   - [ ] RCP (types, boundaries)
   - [ ] Finish schedule (heights)
   - [ ] Sections (confirm heights)
   - [ ] Specifications (products)

5. **Cabinets/Millwork**
   - [ ] Floor plans (locations)
   - [ ] Interior elevations (layouts)
   - [ ] Millwork details (profiles)
   - [ ] Specifications (materials)

---

## Common Extraction Errors to Avoid

1. **Missing items**: Always check ALL sheets for each category
2. **Double counting**: Same item shown on multiple sheets
3. **Wrong units**: LF vs SF vs EA
4. **Scale errors**: Verify scale matches dimension strings
5. **Type confusion**: Wall type A on one floor ≠ Type A on another
6. **Demo vs new**: Don't count items to be demolished

---

## Output Format

Always structure extracted data as:

```json
{
  "sheet_info": {
    "sheet_number": "A1.01",
    "sheet_title": "FIRST FLOOR PLAN",
    "scale": "1/4\" = 1'-0\""
  },
  "walls": [...],
  "ceilings": [...],
  "doors": [...],
  "windows": [...],
  "cabinets": [...],
  "trim": [...],
  "confidence_summary": {
    "overall": 85,
    "by_category": {...}
  },
  "extraction_warnings": [...]
}
```
