# Vision Extraction Error Fix - Page 2 Non-2xx Status Code

## Root Causes Identified

### 1. **CRITICAL: Column Mismatch - user_id Does Not Exist**
- **Problem**: The edge function was trying to insert `user_id` into `takeoff_data` table
- **Reality**: The `takeoff_data` table does NOT have a `user_id` column
- **Actual Column**: Uses `tenant_id` instead for multi-tenant support
- **Impact**: Every insert would fail with a database error

### 2. **RLS Policy Violations**
The `takeoff_data` table has strict RLS policies requiring:
- `tenant_id = auth.uid()` OR
- `organization_id` in user's organizations OR
- `plan_id` exists in plans owned by the user

**Problem**: The function was not setting `tenant_id` or `organization_id`, causing RLS to block inserts.

### 3. **Non-Existent Column References**
- Function tried to use `door_type` and `window_type` columns
- These columns don't exist in the table
- Should use `description` field instead

### 4. **Missing Plan Context**
- Function didn't fetch plan details before inserting
- Couldn't inherit `tenant_id` or `organization_id` from the plan
- Made RLS compliance impossible

## Fixes Applied

### ✅ 1. Fetch Plan Details First
```typescript
const { data: plan, error: planError } = await supabaseClient
  .from('plans')
  .select('user_id, tenant_id, organization_id')
  .eq('id', planId)
  .single();
```

### ✅ 2. Use Correct Base Item Structure
```typescript
const baseItem = {
  plan_id: planId,
  tenant_id: plan.tenant_id || user.id,  // RLS compliant
  organization_id: plan.organization_id || null,
  page_number: pageNumber || 1
};
```

### ✅ 3. Removed Non-Existent Columns
- Removed `user_id` from all inserts
- Removed `door_type` and `window_type`
- Using `description` field for door/window types

### ✅ 4. Enhanced Error Logging
```typescript
console.error('DB insert error:', tErr.message, tErr.details, tErr.hint);
return json({ 
  error: 'Database insert failed', 
  details: tErr.message, 
  hint: tErr.hint 
}, 500);
```

### ✅ 5. Comprehensive Validation
- Check if plan exists before processing
- Validate parsed JSON before insertion
- Log each step for debugging
- Return detailed error messages

## Additional Safeguards

### Rate Limit Handling
- Exponential backoff retry (3 attempts)
- Handles 429 (rate limit) and 503 (service unavailable)
- Max delay of 10 seconds between retries

### Token Management
- Reduced max_tokens from 4000 to 3000
- Tracks usage in `api_usage_tracking` table
- Logs token consumption for monitoring

### Error Recovery
- Catches JSON parse errors
- Validates AI response before processing
- Returns specific error codes (403, 500, 502)
- Includes stack traces for debugging

## Testing Recommendations

1. **Test Page 2 Extraction**
   - Upload a multi-page PDF
   - Extract Page 1 successfully
   - Verify Page 2 now works without errors

2. **Verify RLS Compliance**
   - Check that `tenant_id` is set correctly
   - Verify organization-based access works
   - Test with different user roles

3. **Monitor API Usage**
   - Check `api_usage_tracking` table
   - Monitor token consumption
   - Watch for rate limit warnings in logs

4. **Check Data Integrity**
   - Verify all extracted items appear in `takeoff_data`
   - Confirm `tenant_id` and `organization_id` are populated
   - Validate confidence scores and quantities

## Database Schema Reference

### takeoff_data Table Key Columns
- `tenant_id` (uuid) - Required for RLS
- `organization_id` (uuid) - Optional, for org-based access
- `plan_id` (uuid) - Links to plans table
- `item_type` (text) - wall, ceiling, door, window, specification
- `description` (text) - General description field
- `wall_type`, `ceiling_type` - Specific type fields
- NO `user_id` column exists

### RLS Policies
```sql
-- INSERT policy requires:
tenant_id = auth.uid() 
OR 
organization_id IN (user's organizations)
OR
plan_id IN (plans owned by user)
```

## Prevention Measures

1. **Always fetch plan details** before inserting takeoff data
2. **Use tenant_id**, never user_id for takeoff_data
3. **Validate column existence** before inserting
4. **Log extensively** for production debugging
5. **Test multi-page documents** thoroughly

## Success Indicators

✅ Page 2 extraction completes without errors
✅ Data appears in takeoff_data table
✅ tenant_id is correctly populated
✅ RLS policies allow access
✅ No rate limit errors
✅ Comprehensive error messages if issues occur
