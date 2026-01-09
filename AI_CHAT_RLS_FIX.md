# AI Chat RLS Fix - Issue Resolution

## Problem
AI Chat was unable to see any data due to Row Level Security (RLS) policies blocking access to `plan_conversations` and `takeoff_data` tables.

## Root Cause
The Edge Function `analyze-construction-plans` was creating a Supabase client without passing the user's authentication context, causing:
1. Inserts into `plan_conversations` without `user_id` set
2. RLS policies blocking SELECT queries because data wasn't associated with the authenticated user
3. Edge Function using service-level access while frontend used user-level access

## Solution Applied

### 1. Pass User Auth Context to Edge Function
Updated `analyze-construction-plans` Edge Function to:
- Extract the `Authorization` header from incoming requests
- Pass it to the Supabase client initialization
- Get authenticated user via `supabaseClient.auth.getUser()`

### 2. Explicitly Set user_id on Inserts
Modified conversation inserts to include `user_id`:
```typescript
await supabaseClient.from('plan_conversations').insert([
  { plan_id: planId, user_id: user.id, role: 'user', message: prompt },
  { plan_id: planId, user_id: user.id, role: 'assistant', message: aiResponse }
]);
```

### 3. Verified RLS Policies
Confirmed existing RLS policies are correct:

**plan_conversations:**
- SELECT: Users can view conversations for their own plans
- INSERT: Users can insert conversations for their own plans
- ALL: Users can manage conversations where `auth.uid() = user_id`

**takeoff_data:**
- SELECT: Users can view takeoff data for their own plans
- INSERT: Users can insert takeoff data for their own plans

**construction_plans:**
- ALL: Users can manage their own plans (`auth.uid() = user_id`)

## Testing
1. Upload a construction plan PDF
2. Extract data using Vision Extract tab
3. Switch to AI Chat tab
4. Ask questions about the extracted data
5. Verify conversation history persists and is visible

## Result
✅ AI Chat can now see extracted data
✅ Conversations are properly stored with user association
✅ RLS policies correctly enforce data isolation between users
✅ No security bypass - all access properly authenticated
