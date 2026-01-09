# Comprehensive Construction Drawing Extraction Guide

## Overview
The AI Vision extraction system now captures ALL elements from construction drawings, not just basic measurements.

## What Gets Extracted

### 1. PROJECT METADATA
- **Project Name**: Full project title
- **Project Address**: Complete address
- **Project Number**: Job/project number
- **Architect**: Architect name/firm
- **Engineer**: Engineer name/firm  
- **Contractor**: Contractor if listed

### 2. DRAWING METADATA
- **Sheet Number**: Sheet ID (e.g., A-101, S-201)
- **Sheet Title**: Sheet description
- **Drawing Scale**: Exact scale notation (e.g., "1/4" = 1'-0")
- **Revision Number**: Revision letter/number
- **Revision Date**: Date of last revision

### 3. SCALE UNDERSTANDING
The AI now:
- Identifies scale notation on drawings
- Calculates actual dimensions from drawing measurements
- Recognizes graphic scales (ruler-like scales)
- Notes when scale varies by detail or section
- Marks data as `calculated_from_scale: true`

Common scale formats recognized:
- `1/4" = 1'-0"` (architectural)
- `1:50` (metric)
- `SCALE: 1/8 INCH = 1 FOOT`
- Graphic scales with measurements

### 4. ROOM DATA
For each room:
- Room name/label
- Room number (if numbered)
- Room area in SF (calculated from scale)

### 5. WALL DATA
For each wall:
- Length in feet (calculated from scale)
- Height in feet
- Wall type/material (e.g., "2x4 @ 16" OC", "CMU 8"")
- Adjacent room name
- Notes/callouts
- Confidence score (0-1)

### 6. CEILING DATA
For each ceiling:
- Area in square feet
- Ceiling type (e.g., "GWB", "ACT 2x4", "EXPOSED")
- Ceiling height
- Room name
- Notes
- Confidence score

### 7. DOOR DATA
For each door:
- Count/quantity
- Door type/size (e.g., "3070 HM", "PR 6070 GL")
- Location/room
- Door mark/number
- Hardware/finish notes

### 8. WINDOW DATA
For each window:
- Count/quantity
- Window type/size
- Location/room
- Window mark/number
- Specifications

### 9. DETAIL REFERENCES
- Detail callouts (e.g., "3/A-5", "DETAIL 2")
- Section cut references
- Cross-references to other sheets

### 10. NOTES & SPECIFICATIONS
- General notes from the sheet
- Material specifications
- Finish schedules
- Construction notes

## How to Use

1. **Upload Plan**: Upload your construction drawing PDF
2. **Run Vision Extract**: Click "Extract with AI Vision"
3. **Review Results**: Check the comprehensive data in organized tabs:
   - Project & Drawing Info
   - All Items
   - Walls
   - Ceilings
   - Doors
   - Windows
   - Rooms

4. **Use AI Chat**: Ask questions about the extracted data:
   - "What's the total wall length?"
   - "List all door types"
   - "What scale is this drawing?"
   - "Show me all rooms and their areas"

## Database Schema

All extracted data is stored in the `takeoff_data` table with these fields:

```sql
- project_name TEXT
- project_address TEXT
- project_number TEXT
- architect TEXT
- engineer TEXT
- contractor TEXT
- sheet_number TEXT
- sheet_title TEXT
- drawing_scale TEXT
- revision_number TEXT
- revision_date TEXT
- detail_references TEXT
- section_references TEXT
- notes TEXT
- specifications TEXT
- room_number TEXT
- room_area NUMERIC
- material_spec TEXT
- raw_dimensions TEXT
- calculated_from_scale BOOLEAN
- scale_factor NUMERIC
```

## Tips for Best Results

1. **High-Quality Images**: Upload clear, high-resolution PDFs
2. **Standard Notation**: Drawings with standard architectural notation work best
3. **Legible Text**: Ensure text and dimensions are readable
4. **Complete Sheets**: Include title blocks and legend information
5. **Review Confidence**: Check confidence scores - lower scores may need manual verification

## Troubleshooting

**AI can't find scale**: 
- Ensure scale notation is visible in the image
- Check if scale is in title block or near drawings

**Missing project info**:
- Verify title block is included in the image
- Some fields may be blank if not present on sheet

**Incorrect measurements**:
- Verify the scale was read correctly
- Check if dimensions are architectural vs. engineering scale

**Low confidence scores**:
- May indicate unclear drawings or unusual notation
- Review and manually verify these items
