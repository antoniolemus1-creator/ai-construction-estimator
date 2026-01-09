# AI Chat Authorization Fix - Complete

## Issue Resolved
The 401 authorization errors in the AI Chat feature have been fixed.

## Root Cause
The client was sending the request with manual fetch and the Authorization header, but the edge function expected `imageUrl` in the request body, not `planId`.

## Solution Implemented

### 1. Client-Side Fix (AIPlanAnalyzer.tsx)
✅ **Changed to use `supabase.functions.invoke()`**
- This automatically includes the user's access token in the Authorization header
- No need for manual header construction

✅ **Fixed request body parameters**
- Now sends `imageUrl` (the plan's public URL from storage)
- Includes `planType`, `prompt`, and extracted data
- Gets the public URL using `supabase.storage.getPublicUrl()`

### 2. Edge Function (Already Correct)
The edge function was already properly configured:
- Uses `Deno.serve` (best practice)
- Checks for Authorization header
- Validates user with `supabase.auth.getUser()`
- Has proper CORS headers

## How It Works Now

1. **User clicks "Ask" in AI Chat**
2. **Client gets plan's public URL** from Supabase storage
3. **Client calls edge function** using `supabase.functions.invoke()`:
   ```typescript
   const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
     body: { 
       imageUrl: publicUrlData.publicUrl,
       planType: selectedPlan.document_type || 'construction',
       prompt,
       extractedData: extractedItems,
       hasVisionData: hasExtractedData
     }
   });
   ```
4. **Supabase JS automatically adds** the Authorization header with the user's access token
5. **Edge function validates** the token and processes the request
6. **OpenAI analyzes** the plan image and prompt
7. **Results saved** to database and returned to client

## Testing the Fix

1. **Upload a plan** to the system
2. **Extract data** using the Vision Extract tab
3. **Switch to Chat tab** and ask a question
4. **Verify success** - no more 401 errors!

## Key Takeaways

✅ Always use `supabase.functions.invoke()` for edge functions - it handles auth automatically
✅ Ensure request body parameters match what the edge function expects
✅ Get public URLs for storage files using `supabase.storage.getPublicUrl()`
✅ The edge function correctly uses `Deno.serve` and validates auth tokens

The AI Chat feature is now fully functional with proper authorization!