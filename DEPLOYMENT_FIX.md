# Quick Fix for Video Analysis Error

## The Problem
Edge function returns non-2xx status code (500 error)

## Most Likely Causes
1. **Missing OPENAI_API_KEY** - Function now works without it (basic analysis)
2. **Database connection issue** - Check Supabase environment variables
3. **Duplicate video** - Video already analyzed

## Quick Fix Steps

### 1. Install Supabase CLI

**macOS:**
```bash
brew install supabase/tap/supabase
```

**Windows (PowerShell):**
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux:**
```bash
brew install supabase/tap/supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Your Project
```bash
supabase link --project-ref redpqikxihoemhpnldtq
```

### 4. Check Current Secrets
```bash
supabase secrets list
```

### 5. Set OpenAI Key (Optional - function works without it)
```bash
supabase secrets set OPENAI_API_KEY=your-key-here
```

Get key from: https://platform.openai.com/api-keys

### 6. Check Function Logs
```bash
supabase functions logs analyze-video-content --follow
```

## Testing

Test the function:
```bash
supabase functions invoke analyze-video-content \
  --body '{"videoId":"test123","videoTitle":"Test Video","videoDescription":"Test description","userId":"your-user-id"}'
```

## What Changed

The function now:
- ✅ Works WITHOUT OpenAI key (basic analysis)
- ✅ Better error messages
- ✅ Handles duplicate videos gracefully
- ✅ Simplified code for reliability

## Still Getting Errors?

1. **Check logs:** `supabase functions logs analyze-video-content`
2. **Verify userId:** Make sure you're logged in
3. **Check database:** Ensure `analyzed_videos` table exists
4. **Test simple payload:** Use minimal data first

## Common Error Solutions

**"Missing videoId or userId"**
- Make sure you're signed in to the app

**"Video already analyzed"**
- Delete from analyzed videos list first

**"Database insert failed"**
- Check Supabase dashboard for table structure
- Verify RLS policies allow inserts

## Need More Help?

View detailed logs:
```bash
supabase functions logs analyze-video-content > error-log.txt
```

Then share error-log.txt for troubleshooting.
