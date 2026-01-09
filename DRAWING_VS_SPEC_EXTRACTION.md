# Construction Drawings vs Specifications - AI Extraction Guide

## Overview
This system now distinguishes between **Construction Drawings** and **Specifications** and extracts data appropriately from each document type.

## Key Differences

### Construction Drawings
**What they show:** Visual/graphical representation of the project
- Floor plans, elevations, sections, details
- Dimensions, scales, and spatial relationships
- Location and arrangement of building elements
- Grid lines, detail callouts, section references

**What we extract:**
- Project metadata (name, address, architect, engineer, sheet numbers)
- Drawing scales (1/4"=1'-0", 1:50, graphic scales)
- Spatial data (rooms, walls, ceilings, floors)
- Building elements (doors, windows, columns)
- Detail references and callouts
- Dimensions and measurements
- General notes on drawings

### Specifications
**What they contain:** Written requirements for materials and workmanship
- Material descriptions and requirements
- Manufacturer names and product numbers
- Installation methods and procedures
- Quality standards (ASTM, etc.)
- Testing and warranty requirements
- Submittals required

**What we extract:**
- Division and section numbers (CSI format)
- Material names and descriptions
- Manufacturer and model information
- Installation methods
- Quality standards
- Submittal requirements
- Testing requirements
- Warranty requirements

## Upload Workflow

### Step 1: Upload Document
User uploads PDF and provides:
- Project name
- Document type selection:
  - **Drawings Only** - Floor plans, elevations, sections
  - **Specifications Only** - Written material specs
  - **Both** - Combined document set
- Checkbox: "Contains material specifications"
- Total pages (optional)

### Step 2: Page Selection
- User can select which pages to extract
- Useful for skipping cover pages, redundant sheets, or irrelevant pages
- "Select All" button for convenience

### Step 3: AI Extraction
System automatically:
1. Identifies document type
2. Uses appropriate extraction prompt
3. Extracts all relevant data
4. Identifies missing critical information
5. Generates clarification questions if needed

## AI Clarification System

When AI encounters missing or unclear data, it asks questions:

### Question Types
1. **Scale Clarification** - Drawing scale not found or unclear
2. **Deck Height** - Ceiling/deck heights not specified
3. **Wall Type** - Wall type designations missing
4. **Missing Dimension** - Critical dimensions unclear
5. **Unclear Specification** - Spec language ambiguous
6. **Missing Material** - Material not specified

### User Response Flow
1. AI generates questions after extraction
2. User receives notification
3. Dialog shows all questions with context
4. User provides answers
5. Answers stored for AI training
6. Future extractions improve based on learned patterns

## Data Storage

### Tables
- **plan_uploads** - Tracks uploaded documents
- **takeoff_data** - Extracted drawing data (walls, ceilings, etc.)
- **specifications** - Extracted spec data (materials, methods)
- **ai_clarification_questions** - Questions and answers for training

### AI Learning
All clarification questions and answers are marked `used_for_training: true`
- System learns from every project
- Improves accuracy over time
- Reduces future clarification needs
- Builds project-specific knowledge

## Comprehensive Extraction Elements

### From Drawings
✓ Project name, address, location
✓ Architect, engineer names
✓ Sheet numbers, titles, revisions
✓ Drawing scales (all formats)
✓ Room data (names, numbers, areas)
✓ Wall types, lengths, heights
✓ Ceiling types, heights, areas
✓ Doors (count, type, size, location)
✓ Windows (count, type, size, location)
✓ Detail callouts and references
✓ Section markers
✓ Grid lines and dimensions
✓ General notes
✓ Material callouts
✓ Code references

### From Specifications
✓ Division numbers (CSI format)
✓ Section numbers and titles
✓ Material names and descriptions
✓ Manufacturer information
✓ Model/product numbers
✓ Material properties
✓ Installation methods
✓ Quality standards (ASTM, etc.)
✓ Submittal requirements
✓ Testing requirements
✓ Warranty requirements

## Usage Tips

1. **Separate uploads** - Upload drawings and specs separately for best results
2. **Select relevant pages** - Skip cover sheets and irrelevant pages
3. **Answer questions promptly** - Helps AI learn faster
4. **Review extracted data** - Verify accuracy and provide feedback
5. **Use chat for clarification** - Ask AI about extracted data

## Benefits

✅ Accurate extraction from both document types
✅ AI learns from every project
✅ Reduces manual data entry
✅ Identifies missing information automatically
✅ Improves over time with user feedback
✅ Comprehensive project data capture
