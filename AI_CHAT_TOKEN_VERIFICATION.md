# AI Chat Token Verification Guide

## Current Implementation Status ✅

The implementation is **CORRECT**. The client is properly sending the user's access token:

```typescript
// src/components/AIPlanAnalyzer.tsx (lines 227-254)
const { data: { session } } = await supabase.auth.getSession();

if (!session?.access_token) {
  // Error handling...
  return;
}

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-construction-plans`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`, // ✅ Correct!
    },
    body: JSON.stringify({ ... }),
  }
);
```

## Verification Steps

### 1. Browser Console Test

Open browser console and run:

```javascript
// Get current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Session exists:', !!session);
console.log('Access token exists:', !!session?.access_token);
console.log('Token preview:', session?.access_token?.substring(0, 50) + '...');

// Test the edge function directly
const testCall = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-construction-plans`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ 
      planId: '00000000-0000-0000-0000-000000000000',
      prompt: 'Test message'
    }),
  }
);

const result = await testCall.json();
console.log('Response:', result);
```

### 2. Network Tab Verification

1. Open Chrome DevTools → Network tab
2. Try to use AI Chat in the app
3. Find the request to `analyze-construction-plans`
4. Check Request Headers:
   - Should see: `Authorization: Bearer eyJhbGciOiJI...` (long JWT token)
   - Should NOT see: `Authorization: Bearer sbp_...` (anon key)

### 3. cURL Test (Terminal)

First, get your access token:

```bash
# In browser console:
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.access_token);
```

Then test with cURL:

```bash
curl -i \
  -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","planId":"00000000-0000-0000-0000-000000000000"}' \
  https://redpqikxihoemhpnldtq.supabase.co/functions/v1/analyze-construction-plans
```

## Common Issues & Solutions

### Issue 1: Getting 401 Unauthorized

**Symptoms:**
- Error: "Not authenticated - please log in"
- Status code: 401

**Solutions:**

1. **User not logged in:**
   ```javascript
   // Check if user is logged in
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) {
     console.log('User not logged in!');
     // Redirect to login
   }
   ```

2. **Session expired:**
   ```javascript
   // Refresh session
   const { data: { session }, error } = await supabase.auth.refreshSession();
   if (error) {
     console.log('Session refresh failed:', error);
     // Redirect to login
   }
   ```

3. **Wrong Supabase project:**
   - Verify `VITE_SUPABASE_URL` matches your project
   - Verify `VITE_SUPABASE_ANON_KEY` is correct

### Issue 2: Token is anon key instead of user token

**Check in console:**
```javascript
// This should be FALSE:
session?.access_token === import.meta.env.VITE_SUPABASE_ANON_KEY
```

### Issue 3: CORS errors

**Solution:** Already fixed in edge function with proper CORS headers.

## Database RLS Verification

Check that RLS policies exist:

```sql
-- Check plan_conversations policies
SELECT * FROM pg_policies 
WHERE tablename = 'plan_conversations';

-- Check takeoff_data policies  
SELECT * FROM pg_policies
WHERE tablename = 'takeoff_data';

-- Test insert as authenticated user
INSERT INTO plan_conversations (plan_id, user_id, role, message)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  auth.uid(),
  'user',
  'Test message'
);
```

## Edge Function Logs

Check Supabase Dashboard → Edge Functions → Logs:

1. Look for "Auth header present: true"
2. Look for "Authenticated user: [user-id]"
3. Check for any error messages

## Test Sequence

1. **Login fresh:**
   ```javascript
   await supabase.auth.signOut();
   await supabase.auth.signInWithPassword({
     email: 'test@example.com',
     password: 'password'
   });
   ```

2. **Verify session:**
   ```javascript
   const { data: { session } } = await supabase.auth.getSession();
   console.assert(session?.access_token, 'No access token!');
   ```

3. **Test AI Chat:**
   - Upload a plan
   - Extract data using Vision Extract tab
   - Try AI Chat with a simple question

## Expected Behavior

When everything is working:

1. User logs in → Gets access token (JWT)
2. AI Chat sends request with `Authorization: Bearer [JWT]`
3. Edge function validates token → Gets user ID
4. OpenAI processes request
5. Response saved to database with user_id
6. Chat displays AI response

## Still Getting 401?

If you're still getting 401 after verification:

1. **Check Supabase Auth settings:**
   - Dashboard → Authentication → Settings
   - Verify JWT expiry time (default: 3600 seconds)
   - Check if email confirmation is required

2. **Test with a new user:**
   ```sql
   -- Create test user (in SQL Editor)
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES (
     'aitest@example.com',
     crypt('testpass123', gen_salt('bf')),
     NOW()
   );
   ```

3. **Enable debug logging:**
   ```typescript
   // In edge function
   console.log('Full auth header:', authHeader);
   console.log('Token length:', authHeader?.length);
   console.log('Starts with Bearer:', authHeader?.startsWith('Bearer '));
   ```

## Contact Support

If none of the above resolves the issue:

1. Provide the request ID from edge function logs
2. Include browser console errors
3. Share network tab screenshot showing the request headers