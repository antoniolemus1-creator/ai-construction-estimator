# Drawing Upload and Extraction Workflow Fix

## Issue Resolved
Fixed "Extraction failed: Plan file not found" error that occurred when attempting to extract data from uploaded PDF drawings.

## Root Cause
The VisionExtractorPanel component was still querying the old `plan_uploads` and `construction_plans` tables (lines 127 and 141) which were dropped during the plans table consolidation. This caused the file lookup to fail.

## Changes Made

### VisionExtractorPanel.tsx
Updated three database queries to use the unified `plans` table:

1. **handleExtract function (lines 124-151)**: Changed file path retrieval from old tables to unified plans table
   - Now queries `plans` table for file_url, file_path, and file_name
   - Maintains backward compatibility with both file_url and file_path columns

2. **checkAndTriggerCrossReference function (line 327-330)**: Updated to query plans table for document type checking

3. **loadPlanName function (lines 366-372)**: Updated to fetch plan name from plans table

## Testing Workflow
To test the complete drawing upload and extraction workflow:

1. **Upload a PDF drawing**:
   - Navigate to AI Plan Analysis page
   - Click "Upload Plan" and select a PDF file
   - File should be stored in plans table with file_url

2. **Verify storage**:
   - Check plans table in Supabase for new record
   - Confirm file_url or file_path is populated
   - Verify file exists in construction-plans storage bucket

3. **Run AI extraction**:
   - Click "Extract with AI Vision" button
   - System should successfully retrieve file from storage
   - PDF pages should be converted to images
   - AI should analyze each page and extract data
   - Extracted data should be stored in takeoff_data table

## Expected Results
- ✅ No "Plan file not found" errors
- ✅ PDF successfully loaded and converted to images
- ✅ AI extraction processes all pages
- ✅ Data stored in takeoff_data table with correct plan_id reference
- ✅ Cross-reference analysis triggers if both drawings and specs exist

## Database Schema
The unified `plans` table supports both:
- `file_url`: Full public URL to the file (newer uploads)
- `file_path`: Relative path in storage bucket (older uploads)

The extraction workflow now checks both columns for maximum compatibility.
