# Troubleshooting Deployment Issues

## Error: "supabase: command not found"

### Cause
CLI not installed or not in PATH

### Solutions
1. **Restart terminal** after installation
2. **Verify installation:**
   ```bash
   which supabase  # macOS/Linux
   where supabase  # Windows
   ```
3. **Reinstall using npm:**
   ```bash
   npm install -g supabase
   ```

## Error: "Failed to link project"

### Cause
Invalid project reference or authentication issue

### Solutions
1. **Verify project ref:**
   - Dashboard > Project Settings > General
   - Should be format: `abcdefghijklmnop`
   
2. **Check authentication:**
   ```bash
   supabase logout
   supabase login
   ```

3. **Verify database password:**
   - Use password from project setup
   - Reset in Dashboard > Settings > Database if needed

## Error: "OpenAI API error: 401 Unauthorized"

### Cause
Invalid or expired API key

### Solutions
1. **Verify key format:**
   - Should start with `sk-`
   - No spaces or quotes
   
2. **Check OpenAI account:**
   - Visit https://platform.openai.com/account/billing
   - Ensure you have credits or payment method
   
3. **Re-set secret:**
   ```bash
   supabase secrets unset OPENAI_API_KEY
   supabase secrets set OPENAI_API_KEY=sk-your-new-key
   ```

4. **Test key directly:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_KEY"
   ```

## Error: "Function timeout"

### Cause
OpenAI API slow response or network issues

### Solutions
1. **Check OpenAI status:**
   - Visit https://status.openai.com
   
2. **Increase timeout (if needed):**
   - Edit function code, add timeout config
   
3. **Try again:**
   - First requests are often slower
   
4. **Check logs:**
   ```bash
   supabase functions logs analyze-video-content
   ```

## Error: "CORS policy blocked"

### Cause
Missing or incorrect CORS headers

### Solutions
Already fixed in code! Headers included:
```typescript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
```

If still seeing errors:
1. **Clear browser cache**
2. **Check Supabase project settings:**
   - Dashboard > Settings > API
   - Verify URL is correct in your app

## Error: "Edge Function returned non-2xx status"

### Cause
Function error or missing parameters

### Solutions
1. **Check logs immediately:**
   ```bash
   supabase functions logs analyze-video-content
   ```

2. **Verify request format:**
   ```json
   {
     "videoId": "required",
     "videoTitle": "required",
     "videoDescription": "optional"
   }
   ```

3. **Test with minimal payload:**
   ```bash
   supabase functions invoke analyze-video-content \
     --body '{"videoId":"test","videoTitle":"Test"}'
   ```

4. **Check function deployment:**
   ```bash
   supabase functions list
   ```

## Error: "Database connection failed"

### Cause
Function can't access database

### Solutions
1. **Verify function has DB access:**
   - Should auto-configure with Supabase
   
2. **Check RLS policies:**
   - Ensure tables allow service role access
   
3. **Verify tables exist:**
   ```sql
   -- Run in SQL Editor
   SELECT * FROM analyzed_videos LIMIT 1;
   SELECT * FROM learned_concepts LIMIT 1;
   SELECT * FROM practice_questions LIMIT 1;
   ```

## Error: "Module not found" or Import errors

### Cause
Missing dependencies in edge function

### Solutions
1. **Check import_map.json:**
   ```json
   {
     "imports": {
       "openai": "npm:openai@^4.20.0"
     }
   }
   ```

2. **Redeploy function:**
   ```bash
   supabase functions deploy analyze-video-content
   ```

## Verification Steps

After fixing issues, verify:

```bash
# 1. Check function exists
supabase functions list

# 2. Check secrets
supabase secrets list

# 3. Test function
supabase functions invoke analyze-video-content \
  --body '{"videoId":"test","videoTitle":"Test Video"}'

# 4. Monitor logs
supabase functions logs analyze-video-content --follow
```

## Still Having Issues?

### Collect Debug Information

```bash
# 1. Get function logs
supabase functions logs analyze-video-content > logs.txt

# 2. List configuration
supabase functions list > config.txt
supabase secrets list >> config.txt

# 3. Test OpenAI key separately
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY" > openai-test.txt
```

### Check These

- [ ] Supabase CLI version: `supabase --version`
- [ ] Project linked: `supabase projects list`
- [ ] Function deployed: `supabase functions list`
- [ ] Secret set: `supabase secrets list`
- [ ] OpenAI key valid: Test in OpenAI playground
- [ ] Database tables exist: Check in Supabase dashboard
- [ ] RLS policies allow access: Check table policies

### Contact Support

If still stuck, provide:
1. Error message from logs
2. Function deployment output
3. OpenAI key status (valid/invalid, not the actual key)
4. Supabase CLI version
5. Steps you've already tried

---

**Most Common Fix:** Re-set the OpenAI API key secret
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-key
```
