# Plans Table Consolidation Status

## Completed Updates
✅ Created unified 'plans' table migration (20250114000002_consolidate_plans_tables.sql)
✅ Updated AIPlanAnalyzer.tsx to use 'plans' table
✅ Updated VisionExtractorPanel.tsx to use 'plans' table
✅ Updated PlanUploadWizard.tsx to use 'plans' table

## Remaining Files to Update
The following files still reference old tables and need manual updates:

### Components
- ExtractionTrainingDashboard.tsx (line 34: construction_plans)
- PlanExtractionValidator.tsx (line 32: construction_plans)
- TextSearchPanel.tsx (lines 42, 52: construction_plans)
- ConflictsPage.tsx (line 21: construction_plans)
- PlanRevisionPage.tsx (lines 29, 36: construction_plans)
- PlanValidationPage.tsx (line 23: construction_plans)
- ValidationAnalyticsPage.tsx (line 26: construction_plans)
- AIPlanAnalysisPage.tsx (line 34: plan_uploads)

### Edge Functions
- ai-dynamic-schema/index.ts (line 92: construction_plans reference)

## Quick Fix Instructions
Replace all occurrences of:
- `.from('construction_plans')` → `.from('plans')`
- `.from('plan_uploads')` → `.from('plans')`
- `construction_plans(` → `plans(`
- `REFERENCES construction_plans(id)` → `REFERENCES plans(id)`
