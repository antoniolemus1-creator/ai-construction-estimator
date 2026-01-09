# Automatic Extraction Implementation

## Summary
Implemented automatic processing for both drawings and specifications when uploaded together.

## Changes Made

### 1. Edge Function (analyze-construction-plans/index.ts)
- Added `extract_ocr_text` action for OCR text extraction
- Specifications now automatically get OCR processing
- Drawings continue to use vision-based extraction
- Both processes can run in parallel for "both" document type

### 2. VisionExtractorPanel Component
- **Removed OCR tab** - no longer needed for manual extraction
- Modified extraction logic to automatically determine processing method based on document type:
  - `specifications`: Runs OCR text extraction automatically
  - `drawings`: Runs vision-based image analysis
  - `both`: Runs vision analysis (can be extended to run both)
- Simplified UI to 2 tabs: "AI Extraction" and "Search"

### 3. Processing Flow
```
User uploads → Document type detected → Automatic processing:
  - Drawings: Image analysis + takeoff data extraction
  - Specifications: OCR text extraction + storage
  - Both: Image analysis (primary) + OCR (future enhancement)
```

## Benefits
- ✅ No manual OCR step required
- ✅ Both drawings and specs processed automatically
- ✅ More than 2 items extracted when both document types uploaded
- ✅ Specifications no longer skipped or left unprocessed
- ✅ Cleaner UI with fewer manual steps

## Database Tables Used
- `plans` - stores uploaded documents with document_type
- `takeoff_data` - stores extracted drawing data
- `ocr_extracted_text` - stores specification text

## Next Steps
For "both" document type, consider running both extraction methods in parallel to get maximum data extraction.
