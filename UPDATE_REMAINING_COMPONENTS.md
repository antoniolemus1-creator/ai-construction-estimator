# Update Remaining Components - Quick Reference

## Simple Find & Replace Instructions

For all remaining files, use this simple find and replace:

### Find and Replace Patterns:
1. `.from('construction_plans')` → `.from('plans')`
2. `.from('plan_uploads')` → `.from('plans')`
3. `construction_plans(` → `plans(`
4. `REFERENCES construction_plans(id)` → `REFERENCES plans(id)`

## Files Requiring Updates:

### Components:
- src/components/TextSearchPanel.tsx (lines 42, 52)
- src/components/VisionExtractorPanel.tsx (lines 142, 326, 364 - remove fallback)
- src/pages/ConflictsPage.tsx (line 21)
- src/pages/PlanRevisionPage.tsx (lines 29, 36)
- src/pages/PlanValidationPage.tsx (line 23)
- src/pages/ValidationAnalyticsPage.tsx (line 26)
- src/pages/AIPlanAnalysisPage.tsx (line 34)

### Edge Functions:
- supabase/functions/ai-dynamic-schema/index.ts (line 92)

## Already Updated:
✅ AIPlanAnalyzer.tsx
✅ PlanUploadWizard.tsx
✅ ExtractionTrainingDashboard.tsx
✅ PlanExtractionValidator.tsx
✅ Migration created (consolidate_plans_tables.sql)
✅ Database schema updated

## Testing Checklist:
1. Upload a PDF drawing via PlanUploadWizard
2. Verify it appears in 'plans' table
3. Run AI extraction
4. Check takeoff_data references plans correctly
5. Verify all queries work without errors
