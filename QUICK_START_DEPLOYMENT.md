# 🚀 Quick Start: Deploy in 5 Minutes

## Copy-Paste Commands (Replace YOUR_* values)

### 1. Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or use npm (all platforms)
npm install -g supabase
```

### 2. Login & Link
```bash
# Login (opens browser)
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF_HERE
```

**Where to find YOUR_PROJECT_REF:**
- Go to https://supabase.com/dashboard
- Click your project
- Settings > General > Reference ID

### 3. Set OpenAI Key
```bash
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE
```

**Get OpenAI Key:**
- Visit https://platform.openai.com/api-keys
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

### 4. Deploy Function
```bash
supabase functions deploy analyze-video-content
```

### 5. Test It
```bash
supabase functions invoke analyze-video-content \
  --body '{"videoId":"test123","videoTitle":"Test Video","videoDescription":"Construction estimation tutorial"}'
```

### 6. Check Logs
```bash
supabase functions logs analyze-video-content --follow
```

## ✅ Success Indicators

You should see:
- ✅ "Function deployed successfully!"
- ✅ Test returns: `{"success": true, ...}`
- ✅ Logs show: "Video analysis completed"

## ❌ Common Errors

**"command not found"** → Restart terminal after install

**"Failed to link"** → Check project ref and database password

**"401 Unauthorized"** → Verify OpenAI key is valid

**"Timeout"** → Normal for first request, try again

## 📱 Test in Your App

1. Open your app
2. Go to Training page
3. Add YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
4. Click "Analyze Video"
5. Check AI Learning page for concepts

## 🔄 Update Function Later

After code changes:
```bash
supabase functions deploy analyze-video-content
```

## 📊 Monitor Usage

```bash
# List all functions
supabase functions list

# View logs
supabase functions logs analyze-video-content

# List secrets
supabase secrets list
```

---

**Need detailed help?** See `DEPLOYMENT_GUIDE.md` for complete instructions.
