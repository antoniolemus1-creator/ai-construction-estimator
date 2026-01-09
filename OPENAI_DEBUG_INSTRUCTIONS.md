# OpenAI API Debug Instructions

## Problem
The OpenAI API key has not been used once, indicating the analyze-video-content function is either:
1. Not being called at all
2. Failing before reaching the OpenAI API call
3. Being blocked by some configuration issue

## Debugging Steps

### Step 1: Test OpenAI API Key Directly
1. Go to the Training page (AI Training Pipeline)
2. Look for the "OpenAI API Test" card in the right sidebar
3. Click "Test OpenAI Connection" button
4. Check the result:
   - ✅ **Success**: OpenAI API key is valid and working
   - ❌ **Failed**: Check the error message for details

### Step 2: Check Browser Console
When testing or analyzing videos, open browser console (F12) and look for:
- `=== TEST FUNCTION CALLED ===` - confirms function was invoked
- `API Key exists: true/false` - confirms key is available
- `OpenAI Response Status: 200` - confirms API call succeeded
- Any error messages

### Step 3: Check Supabase Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Select "analyze-video-content" or "test-openai-simple"
4. Check the logs for:
   - Function invocation timestamps
   - Error messages
   - OpenAI API responses

### Step 4: Verify Function is Being Called
In the browser console when clicking "Analyze" on a video, you should see:
```
=== Starting Video Analysis ===
Video ID: [video-id]
User ID: [user-id]
Request body: {...}
```

If you DON'T see this, the issue is in the frontend before the function call.

### Step 5: Common Issues and Solutions

#### Issue: "OPENAI_API_KEY not found"
**Solution**: The API key is not set in Supabase secrets
- Verify in Supabase Dashboard > Project Settings > Edge Functions > Secrets
- Key name must be exactly: `OPENAI_API_KEY`

#### Issue: "Invalid API key format"
**Solution**: The API key format is incorrect
- OpenAI keys should start with `sk-`
- Should be 51+ characters long
- Verify the key is copied correctly without extra spaces

#### Issue: Function never called
**Solution**: Check frontend code
- Verify user is logged in
- Check browser console for JavaScript errors
- Verify Supabase client is initialized correctly

#### Issue: "Authentication failed"
**Solution**: API key is invalid or expired
- Generate a new API key from OpenAI dashboard
- Update the key in Supabase secrets

#### Issue: "Quota exceeded"
**Solution**: OpenAI account has no credits
- Add credits to OpenAI account
- Check billing status at platform.openai.com

### Step 6: Manual Test via Supabase
You can manually invoke the test function:
1. Go to Supabase Dashboard > Edge Functions
2. Find "test-openai-simple"
3. Click "Invoke"
4. Send empty body: `{}`
5. Check response

## Expected Flow

### Successful Analysis Flow:
1. User clicks "Analyze" button on video
2. Frontend logs: "Starting Video Analysis"
3. Edge function receives request
4. Edge function logs: "Video Analysis Started"
5. Edge function validates OpenAI key
6. Edge function calls OpenAI API
7. Edge function logs: "OpenAI API call successful"
8. Edge function stores results in database
9. Frontend shows success toast

### Where to Look for Failures:
- **No frontend logs**: Issue with button click handler or user auth
- **Frontend logs but no edge function logs**: Issue with Supabase function invocation
- **Edge function logs but no OpenAI call**: Issue with API key or validation
- **OpenAI call fails**: Issue with API key validity or quota

## Next Steps After Testing

1. Run the OpenAI Test button first
2. If test passes, try analyzing a video
3. Check console logs at each step
4. Report which step fails with exact error message
