# Plan Extraction Database Insert Fix - Complete Guide

## Problem
AI Vision extraction was not populating the `takeoff_data` table after analyzing construction plans.

## Root Causes Identified

### 1. Missing RLS Policies
The `takeoff_data` table had RLS enabled but lacked proper policies that check plan ownership through the `plans` table relationship.

### 2. Suboptimal Edge Function Implementation
- Used deprecated `serve` from deno.land/std instead of built-in `Deno.serve`
- Lacked plan ownership verification before attempting inserts
- Insufficient error logging to diagnose RLS failures

## Solutions Implemented

### 1. Proper RLS Policies (Migration: 20250116000004)

```sql
-- Enable RLS
ALTER TABLE public.takeoff_data ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT INSERT, SELECT, UPDATE, DELETE ON public.takeoff_data TO authenticated;

-- Policy for INSERT: Check plan ownership
CREATE POLICY "insert_takeoff_for_own_plans"
ON public.takeoff_data
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = plan_id AND p.user_id = (SELECT auth.uid())
  )
);
```

**Key Points:**
- Policies check plan ownership via JOIN to `plans` table
- User can only insert/view/update/delete takeoff data for plans they own
- Ensures data isolation and security

### 2. Improved Edge Function

**Changes Made:**
- ✅ Switched from `serve` to `Deno.serve` (recommended by Supabase)
- ✅ Added plan ownership verification BEFORE calling OpenAI API
- ✅ Enhanced error logging with detailed diagnostics
- ✅ Return error codes, hints, and details to frontend
- ✅ Log inserted item IDs for verification

**Plan Ownership Check:**
```typescript
const { data: planCheck, error: planError } = await supabaseClient
  .from('plans')
  .select('id, user_id')
  .eq('id', planId)
  .single();

if (planCheck.user_id !== user.id) {
  return json({ error: 'Not authorized', error_code: 'plan_unauthorized' }, 403);
}
```

### 3. Enhanced Error Visibility

**Console Logging:**
```typescript
console.log('✅ DB INSERT SUCCESS:', tData?.length, 'items inserted');
console.log('Inserted IDs:', tData?.map(d => d.id).join(', '));

// On error:
console.error('❌ DB INSERT ERROR:', tErr);
console.error('Error code:', tErr.code);
console.error('Error hint:', tErr.hint);
```

**Frontend Response:**
```typescript
return json({ 
  success: true, 
  extracted: parsed, 
  itemsStored: items.length,
  message: `Successfully extracted and stored ${items.length} items`
});
```

## How to Verify the Fix

### 1. Check Edge Function Logs
In Supabase Dashboard → Edge Functions → Logs, look for:
- `✅ Authenticated user: [user_id]`
- `✅ Plan ownership verified`
- `✅ JSON parsed successfully`
- `✅ DB INSERT SUCCESS: X items inserted`
- `Inserted IDs: [list of IDs]`

### 2. Check Database
```sql
SELECT * FROM takeoff_data 
WHERE plan_id = '[your_plan_id]' 
ORDER BY created_at DESC;
```

### 3. Frontend Network Tab
- Inspect the response from `analyze-construction-plans` function
- Look for `itemsStored` count in response
- Check for any `error_code` fields

## Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `missing_auth_header` | Not logged in | Ensure user is authenticated |
| `auth_failed` | Invalid token | Re-login |
| `plan_not_found` | Plan doesn't exist | Verify plan ID |
| `plan_unauthorized` | Not plan owner | Check plan ownership |
| `openai_http_error` | OpenAI API failed | Check API key and quota |
| `invalid_json_from_model` | OpenAI returned non-JSON | Check prompt and model |
| `db_insert_takeoff_error` | Database insert failed | Check RLS policies and schema |

## Testing Checklist

- [ ] Run the migration: `20250116000004_fix_takeoff_data_rls_policies.sql`
- [ ] Deploy the updated edge function
- [ ] Create a test plan as authenticated user
- [ ] Upload a construction drawing
- [ ] Click "Analyze with AI Vision"
- [ ] Verify items appear in the takeoff data viewer
- [ ] Check edge function logs for success messages
- [ ] Verify database has new rows in `takeoff_data`

## Frontend Integration

The frontend already correctly uses `supabase.functions.invoke()`:

```typescript
const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
  body: {
    action: 'extract_with_vision',
    planId,
    imageUrl,
    pageNumber,
    analysisConfig
  }
});
```

This automatically:
- Attaches the JWT Authorization header
- Uses the correct function URL
- Handles CORS properly

## Additional Notes

- **Image URLs**: Must be publicly accessible by OpenAI. If using Supabase Storage with private buckets, generate signed URLs first.
- **OpenAI Model**: Using `gpt-4-vision-preview` which requires sufficient API quota.
- **Rate Limiting**: Consider implementing rate limiting for production use.
- **Cost**: Vision API calls are more expensive than text-only calls.

## Success Indicators

When working correctly, you should see:
1. ✅ Items appear in the UI immediately after analysis
2. ✅ Edge function logs show successful inserts with IDs
3. ✅ Database query returns new rows
4. ✅ No error codes in function response
5. ✅ Item count matches extracted items

## Support

If issues persist:
1. Check Supabase Edge Function logs for detailed error messages
2. Verify RLS policies are active: `SELECT * FROM pg_policies WHERE tablename = 'takeoff_data';`
3. Test with a simple plan/drawing first
4. Ensure OpenAI API key has vision model access
