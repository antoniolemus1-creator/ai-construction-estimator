# Complete Deployment Guide: analyze-video-content Edge Function

## Prerequisites Setup

### Step 1: Install Supabase CLI

**For macOS:**
```bash
brew install supabase/tap/supabase
```

**For Windows (PowerShell):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**For Linux:**
```bash
brew install supabase/tap/supabase
```

**Alternative (npm - all platforms):**
```bash
npm install -g supabase
```

Verify installation:
```bash
supabase --version
```

### Step 2: Get Your Supabase Project Details

1. Go to https://supabase.com/dashboard
2. Select your project
3. Note your **Project Reference ID** (found in Project Settings > General)
4. You'll need this for authentication

### Step 3: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Name it "Supabase Video Analysis"
5. Copy the key (starts with `sk-...`)
6. **IMPORTANT:** Save it securely - you won't see it again!

## Deployment Steps

### Step 4: Authenticate Supabase CLI

```bash
supabase login
```

This will open your browser for authentication. Follow the prompts.

### Step 5: Link to Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

You'll be prompted for your database password. Enter it when asked.

### Step 6: Set OpenAI API Key Secret

```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

Replace `sk-your-actual-key-here` with your actual OpenAI API key.

Verify the secret was set:
```bash
supabase secrets list
```

### Step 7: Deploy the Edge Function

```bash
supabase functions deploy analyze-video-content
```

Wait for deployment to complete. You should see:
```
Deploying function analyze-video-content...
Function deployed successfully!
```

### Step 8: Test the Function

Create a test file `test-video-analysis.json`:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "Test Video",
  "videoDescription": "This is a test video about construction estimation and project management."
}
```

Test the function:
```bash
supabase functions invoke analyze-video-content \
  --body '{"videoId":"dQw4w9WgXcQ","videoTitle":"Test Video","videoDescription":"This is a test video about construction estimation."}'
```

### Step 9: Check Logs

View real-time logs:
```bash
supabase functions logs analyze-video-content --follow
```

View recent logs:
```bash
supabase functions logs analyze-video-content
```

## Verification Checklist

✅ Supabase CLI installed and version shows
✅ Successfully logged in to Supabase
✅ Project linked (no errors)
✅ OPENAI_API_KEY secret set (shows in `secrets list`)
✅ Function deployed successfully
✅ Test invocation returns 200 status
✅ Logs show successful execution

## Common Issues & Solutions

### Issue: "supabase: command not found"
**Solution:** Restart your terminal after installation, or add to PATH manually.

### Issue: "Failed to link project"
**Solution:** 
- Verify project reference ID is correct
- Check you have owner/admin access to the project
- Ensure database password is correct

### Issue: "OpenAI API error: 401 Unauthorized"
**Solution:**
- Verify API key is valid and active
- Check you have credits/billing set up on OpenAI account
- Re-set the secret: `supabase secrets set OPENAI_API_KEY=sk-...`

### Issue: "Function timeout"
**Solution:**
- OpenAI API might be slow - this is normal for first requests
- Check OpenAI service status: https://status.openai.com
- Consider upgrading to gpt-3.5-turbo for faster responses (already configured)

### Issue: "CORS error in browser"
**Solution:** Already handled in the function code with proper headers.

## Testing from Your Application

Once deployed, test from your app:

1. Go to the Training page
2. Add a YouTube video URL
3. Click "Analyze Video"
4. Check browser console for any errors
5. Verify concepts appear in the AI Learning page

## Monitoring

### View Function Status
```bash
supabase functions list
```

### View All Logs
```bash
supabase functions logs
```

### Update Function (after code changes)
```bash
supabase functions deploy analyze-video-content
```

## Cost Considerations

- **Supabase Edge Functions:** Free tier includes 500K function invocations/month
- **OpenAI API:** 
  - gpt-3.5-turbo: ~$0.002 per analysis
  - Budget accordingly for your usage

## Next Steps After Deployment

1. Test with a real construction/estimation video
2. Verify concepts are saved to database
3. Check AI Learning page shows the concepts
4. Monitor logs for any errors
5. Set up error alerting if needed

## Support

If you encounter issues:
1. Check logs: `supabase functions logs analyze-video-content`
2. Verify secrets: `supabase secrets list`
3. Test OpenAI key directly: https://platform.openai.com/playground
4. Check Supabase project status in dashboard

## Quick Reference Commands

```bash
# Deploy
supabase functions deploy analyze-video-content

# Test
supabase functions invoke analyze-video-content --body '{"videoId":"test","videoTitle":"Test","videoDescription":"Test video"}'

# Logs
supabase functions logs analyze-video-content --follow

# Update secret
supabase secrets set OPENAI_API_KEY=sk-new-key

# List functions
supabase functions list

# Delete function (if needed)
supabase functions delete analyze-video-content
```

---

**Ready to deploy?** Start with Step 1 above and work through each step carefully.
