# AI Chat Authorization Fix - Complete Solution

## Problem
The AI Chat feature was failing with 401 Unauthorized errors because the client wasn't sending the proper Authorization header with the user's access token.

## Root Cause
The `supabase.functions.invoke()` method was not automatically including the Authorization header with the user's session token, despite the documentation suggesting it should.

## Solution Implemented

### 1. Database RLS Policies
Added proper RLS policies for the tables used by the edge function:

```sql
-- plan_conversations table
ALTER TABLE plan_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_insert_own_convo"
ON plan_conversations
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

-- takeoff_data table  
ALTER TABLE takeoff_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_insert_own_takeoff"
ON takeoff_data
FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id OR user_id IS NULL);
```

### 2. Client-Side Fix (AIPlanAnalyzer.tsx)
Updated the `handleAsk` function to use `fetch` directly with explicit Authorization header:

```typescript
const handleAsk = async () => {
  // Get the current session to include the user's access token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    toast({ 
      title: 'Authentication required', 
      description: 'Please sign in to use AI analysis', 
      variant: 'destructive' 
    });
    return;
  }

  // Use fetch directly with proper Authorization header
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-construction-plans`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // ← Critical fix
      },
      body: JSON.stringify({ 
        planId: selectedPlan.id, 
        prompt,
        extractedData: extractedItems,
        hasVisionData: hasExtractedData
      }),
    }
  );
  
  // Handle response...
};
```

### 3. Edge Function (Already Correct)
The edge function was already properly configured to:
- Extract the Authorization header
- Create a Supabase client with the user's token
- Return 401 if no valid token is provided

## Key Learnings

1. **Don't assume automatic header inclusion**: Even though `supabase.functions.invoke()` documentation suggests it includes auth headers automatically, it may not always work as expected.

2. **Use explicit fetch for critical auth flows**: When authentication is critical, use `fetch` directly with explicit headers for full control.

3. **Always get fresh tokens**: Use `supabase.auth.getSession()` to get the current session token, not stored values that might be stale.

4. **Common Authorization header pitfalls to avoid**:
   - Using the anon key instead of user's access token
   - Missing the "Bearer " prefix
   - Using expired tokens
   - Not checking if session exists before making the request

## Testing the Fix

1. Sign in to the application
2. Upload a construction plan
3. Extract data using the Vision Extract tab
4. Go to the Chat tab
5. Ask a question about the extracted data
6. Verify the AI responds without authorization errors

## Error Handling
The updated code includes:
- Check for session existence before making the request
- User-friendly error messages if authentication fails
- Proper error logging for debugging
- Graceful fallback if the edge function returns non-2xx status

This fix ensures that the AI Chat feature properly authenticates with the edge function using the current user's access token.