# Takeoff Data Insert Issue - FIXED

## Problem
AI Vision extraction was not inserting extracted construction items into the `takeoff_data` table.

## Root Causes Fixed

### 1. Missing organization_id and tenant_id
**Problem**: Edge function was not including `organization_id` and `tenant_id` when inserting records.
**Fix**: Function now fetches plan details and includes both fields in inserts.

### 2. Invalid user_id column
**Problem**: Function tried to insert `user_id` but that column doesn't exist in `takeoff_data`.
**Fix**: Removed `user_id` from insert statements.

### 3. 16 Overlapping RLS Policies
**Problem**: Too many conflicting policies causing confusion and potential blocks.
**Fix**: Dropped all 16 policies and created 4 clean ones:
- `select_takeoff_for_own_plans_or_org` - View data for owned plans or org plans
- `insert_takeoff_for_own_plans_or_org` - Insert data for owned plans or org plans  
- `update_takeoff_for_own_plans_or_org` - Update data for owned plans or org plans
- `delete_takeoff_for_own_plans_or_org` - Delete data (plan owner or org admin)

## Testing
1. Upload a construction plan PDF
2. Click "AI Vision Extraction"
3. Select pages and items to extract
4. Click "Start Extraction"
5. Check Supabase logs for "Successfully inserted items: X"
6. Query: `SELECT * FROM takeoff_data WHERE plan_id = 'your-plan-id'`

## Frontend Usage
Frontend correctly uses `supabase.functions.invoke()` which auto-attaches JWT token.
