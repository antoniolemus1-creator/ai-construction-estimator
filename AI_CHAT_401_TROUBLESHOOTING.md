# AI Chat 401 Error - Complete Troubleshooting Guide

## Changes Made

### 1. Client-Side Diagnostics (AIPlanAnalyzer.tsx)
Added comprehensive session checking before calling the function:
```typescript
const { data: { session } } = await supabase.auth.getSession();
console.log('Session check:', {
  hasSession: !!session,
  hasAccessToken: !!session?.access_token,
  tokenLength: session?.access_token?.length || 0,
  tokenPrefix: session?.access_token?.slice(0, 20) || 'none',
  expiresAt: session?.expires_at
});

if (!session?.access_token) {
  throw new Error('No active session. Please log in again.');
}
```

### 2. Server-Side Diagnostics (Edge Function)
Added detailed logging to track authentication flow:
```typescript
console.log('Auth diagnostics:', {
  hasAuthHeader: !!authHeader,
  startsWithBearer: authHeader?.startsWith('Bearer '),
  tokenLength: authHeader?.replace(/^Bearer\s+/, '').length || 0,
  tokenPrefix: authHeader?.slice(0, 30) || 'none'
});
```

## How to Debug the 401 Error

### Step 1: Check Browser Console
When you click "Ask AI", check the browser console for:
```
Session check: {
  hasSession: true/false,
  hasAccessToken: true/false,
  tokenLength: <number>,
  tokenPrefix: "<first 20 chars>",
  expiresAt: <timestamp>
}
```

**If hasSession is false or hasAccessToken is false:**
- User needs to log out and log back in
- Session has expired

### Step 2: Check Supabase Function Logs
Go to Supabase Dashboard → Edge Functions → analyze-construction-plans → Logs

Look for:
```
Auth diagnostics: {
  hasAuthHeader: true/false,
  startsWithBearer: true/false,
  tokenLength: <number>,
  tokenPrefix: "Bearer eyJhbGci..."
}
```

**If hasAuthHeader is false:**
- The Authorization header is not being sent
- Check if supabase.functions.invoke() is being used correctly

**If startsWithBearer is false:**
- Header format is incorrect
- Should be exactly: `Authorization: Bearer <token>`

**If tokenLength is 0 or very small:**
- Token is empty or malformed

### Step 3: Verify Token Validity
If the token is present but auth still fails, check:

1. **Token expiry**: Look at `expiresAt` in client logs
2. **Project mismatch**: Token must be from project `redpqikxihoemhpnldtq`
3. **Token issuer**: Run this in browser console:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const payload = JSON.parse(atob(session.access_token.split('.')[1]));
console.log('Token issuer:', payload.iss);
console.log('Token audience:', payload.aud);
console.log('Token expires:', new Date(payload.exp * 1000));
```

Should show:
- iss: `https://redpqikxihoemhpnldtq.supabase.co/auth/v1`
- aud: `authenticated`
- exp: Future timestamp

## Common Causes and Solutions

### 1. Expired Session
**Symptoms**: Had session before, now getting 401
**Solution**: 
```typescript
// Force refresh the session
const { data: { session }, error } = await supabase.auth.refreshSession();
if (error) {
  // User needs to log in again
  await supabase.auth.signOut();
  // Redirect to login
}
```

### 2. Multiple Supabase Instances
**Symptoms**: Login works but function calls fail
**Solution**: Ensure all code uses the same supabase instance from `@/lib/supabase`

### 3. Storage Bucket Not Public
**Symptoms**: Function works but OpenAI can't access image
**Solution**: Make bucket public or use signed URLs:
```typescript
const { data: signedUrlData } = await supabase.storage
  .from('construction-plans')
  .createSignedUrl(selectedPlan.file_path, 3600); // 1 hour
```

### 4. CORS Issues
**Symptoms**: Preflight OPTIONS succeeds but POST fails
**Solution**: Already handled in function with proper CORS headers

## Testing Checklist

Run through this checklist to diagnose:

- [ ] User is logged in (check AuthContext)
- [ ] Session exists in browser (check localStorage/sessionStorage)
- [ ] Token is not expired (check `expiresAt`)
- [ ] Token is being sent (check Network tab → Headers)
- [ ] Token format is correct (`Bearer <token>`)
- [ ] Token is from correct project
- [ ] Function receives the token (check function logs)
- [ ] `getUser()` succeeds (check function logs)

## Manual Test with cURL

To test the function directly:

1. Get your access token:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log(session.access_token);
```

2. Test with cURL:
```bash
curl -i \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://example.com/test.jpg","planType":"construction","prompt":"Test"}' \
  https://redpqikxihoemhpnldtq.supabase.co/functions/v1/analyze-construction-plans
```

If cURL returns 200 but browser returns 401:
- Problem is in the client code
- Check how the token is being passed

If cURL returns 401:
- Token is invalid/expired
- Get a fresh token and try again

## Next Steps

1. **Try the feature** and check browser console
2. **Check function logs** in Supabase dashboard
3. **Compare** what you see with this guide
4. **If still failing**, share:
   - Browser console logs (redact token values)
   - Function logs from Supabase
   - Whether user is logged in
   - Token expiry time
