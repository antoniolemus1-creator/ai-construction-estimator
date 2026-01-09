# OpenAI Test Function Deployment Guide

## Issue Found
The `test-openai-simple` edge function was referenced in the code but never deployed to Supabase.

## Solution: Deploy the Test Function

### Step 1: Deploy via Supabase CLI

```bash
# Make sure you're in the project root directory
cd your-project-directory

# Deploy the test function
supabase functions deploy test-openai-simple

# Verify it's deployed
supabase functions list
```

### Step 2: Set Environment Variables

The function needs the OPENAI_API_KEY environment variable:

```bash
# Set the OpenAI API key for the function
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

### Step 3: Test via Dashboard

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Find **test-openai-simple**
4. Click **Invoke**
5. Send empty body: `{}`
6. Check the response and logs

### Step 4: Test via App

1. Open your app
2. Go to **Training** page
3. Look for **OpenAI API Test** button in sidebar
4. Click **Test OpenAI Connection**
5. Check the results

## What the Test Function Does

The test function:
- ✅ Checks if OPENAI_API_KEY exists in environment
- ✅ Makes a simple API call to OpenAI
- ✅ Returns detailed error messages at each step
- ✅ Logs everything for debugging

## Expected Results

### Success Response:
```json
{
  "success": true,
  "message": "OpenAI API is working correctly",
  "response": "API test successful",
  "model": "gpt-4o",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 5,
    "total_tokens": 15
  }
}
```

### Error Response (No API Key):
```json
{
  "success": false,
  "error": "OPENAI_API_KEY not configured in Supabase",
  "step": "environment_check"
}
```

### Error Response (Wrong Permissions):
```json
{
  "success": false,
  "error": {
    "error": {
      "message": "You exceeded your current quota...",
      "type": "insufficient_quota",
      "code": "insufficient_quota"
    }
  },
  "status": 429,
  "step": "api_call"
}
```

## Troubleshooting

### Function Not Found Error
- **Cause**: Function not deployed
- **Fix**: Run `supabase functions deploy test-openai-simple`

### Environment Variable Missing
- **Cause**: OPENAI_API_KEY not set
- **Fix**: Run `supabase secrets set OPENAI_API_KEY=your-key`

### Permission Errors
- **Cause**: OpenAI API key permissions incorrect
- **Fix**: Update OpenAI key permissions:
  - Model capabilities: **Write**
  - Models: **Read**

### CORS Errors
- **Cause**: Function not handling OPTIONS requests
- **Fix**: Already handled in the function code

## Next Steps

After deploying and testing:
1. If test succeeds → OpenAI integration is working
2. If test fails → Check the error message and step
3. Review logs in Supabase Dashboard → Edge Functions → test-openai-simple → Logs
