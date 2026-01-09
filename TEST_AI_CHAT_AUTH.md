# AI Chat Authentication Test Guide

## Current Implementation

### Client Side (AIPlanAnalyzer.tsx - Line 221-311)

The client uses `supabase.functions.invoke()` which automatically includes the auth header:

```typescript
// Session check with diagnostics
const { data: { session } } = await supabase.auth.getSession();
console.log('Session check:', {
  hasSession: !!session,
  hasAccessToken: !!session?.access_token,
  tokenLength: session?.access_token?.length || 0,
  tokenPrefix: session?.access_token?.slice(0, 20) || 'none',
  expiresAt: session?.expires_at
});

// Function invocation (auth header added automatically)
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

### Server Side (analyze-construction-plans/index.ts - Line 27-82)

The server now has comprehensive diagnostics:

```typescript
const authHeader = req.headers.get('Authorization') || '';

// Comprehensive auth diagnostics (safe - no token logging)
console.log('=== AUTH DIAGNOSTICS ===');
console.log('Auth header present:', !!authHeader);
console.log('Auth header starts with Bearer:', authHeader.startsWith('Bearer '));
console.log('Token length:', authHeader.replace(/^Bearer\s+/, '').length);
console.log('Full headers:', Object.fromEntries(req.headers.entries()));
```

## Testing Steps

### 1. Check Browser Console

When you click "Ask" in the AI Chat:

**Expected client logs:**
```
Session check: {
  hasSession: true,
  hasAccessToken: true,
  tokenLength: 200+ (JWT tokens are typically 200-500 chars),
  tokenPrefix: "eyJhbGciOiJIUzI1NiIs..." (first 20 chars),
  expiresAt: <future timestamp>
}
```

**If session is missing:**
- Log out and log back in
- Check if you're on the correct Supabase project
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

### 2. Check Supabase Function Logs

Go to: Supabase Dashboard → Edge Functions → analyze-construction-plans → Logs

**Expected server logs:**
```
=== AUTH DIAGNOSTICS ===
Auth header present: true
Auth header starts with Bearer: true
Token length: 200+ (should match client token length)
✅ Authenticated user: <user-id>
```

**If auth header is missing:**
- The client isn't sending it (check supabase client initialization)
- CORS issue (check if OPTIONS request succeeds)

**If auth header doesn't start with "Bearer ":**
- Format issue in client code
- Check if using manual fetch instead of supabase.functions.invoke()

**If token length is 0 or very short:**
- Empty or malformed token
- Check client session state

**If "Auth error" or "No user found":**
- Token is from wrong project (check aud claim)
- Token is expired
- Token is invalid

### 3. Manual curl Test

To isolate frontend issues, test with curl:

```bash
# 1. Get your access token from browser console:
const { data: { session } } = await supabase.auth.getSession()
console.log(session.access_token)

# 2. Save token to file
echo "YOUR_TOKEN_HERE" > token.txt

# 3. Test with curl
curl -i \
  -H "Authorization: Bearer $(cat token.txt)" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","imageUrl":"https://example.com/test.jpg","hasVisionData":false}' \
  https://redpqikxihoemhpnldtq.supabase.co/functions/v1/analyze-construction-plans
```

**If curl returns 200:** Problem is in client code
**If curl returns 401:** Problem is with token or server config

## Common Issues and Solutions

### Issue: "No authorization header provided"
**Cause:** Client not sending Authorization header
**Solution:** 
- Ensure using `supabase.functions.invoke()` not manual fetch
- Check if supabase client has active session

### Issue: "Invalid authorization format"
**Cause:** Header doesn't start with "Bearer "
**Solution:**
- Use `supabase.functions.invoke()` which formats correctly
- If using manual fetch: `Authorization: Bearer ${token}`

### Issue: "Authentication failed" or "Token may be expired"
**Cause:** Token is invalid, expired, or from wrong project
**Solution:**
- Log out and log back in to get fresh token
- Verify project URL matches: redpqikxihoemhpnldtq.supabase.co
- Check token expiration: `session.expires_at`

### Issue: "No user session"
**Cause:** Token doesn't resolve to a user
**Solution:**
- Token may be corrupted or tampered with
- Refresh session: `await supabase.auth.refreshSession()`

## Next Steps After 401 is Fixed

Once authentication works (200 response), verify:

1. **Database inserts work:**
   - Check `plan_conversations` table for new rows
   - Verify user_id matches authenticated user

2. **RLS policies allow access:**
   - User can read their own conversations
   - User can insert new conversations

3. **OpenAI integration works:**
   - Check for OpenAI API errors in logs
   - Verify OPENAI_API_KEY is set in function secrets
