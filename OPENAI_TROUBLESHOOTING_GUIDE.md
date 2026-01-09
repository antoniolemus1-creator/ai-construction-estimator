# OpenAI API Troubleshooting Guide

## Overview
This guide helps diagnose and resolve OpenAI API connectivity issues in the AI Learning video analysis system.

## Built-in Diagnostics Tool

### Location
Navigate to **Video Analysis Dashboard** → **OpenAI API Diagnostics** card

### Running Diagnostics
1. Click "Run Diagnostics" button
2. Wait for all checks to complete
3. Review the results for each check:
   - ✅ **PASS**: Check successful
   - ❌ **FAIL**: Issue detected

## Common Issues and Solutions

### 1. API Key Not Found
**Symptom**: "No API key found in environment"

**Solution**:
```bash
# Verify the secret exists
supabase secrets list

# If missing, set it:
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### 2. Invalid API Key Format
**Symptom**: "Key does not start with sk-"

**Solution**:
- OpenAI API keys must start with `sk-`
- Verify you're using the correct key from https://platform.openai.com/api-keys
- Update the secret with the correct key

### 3. API Connection Failed
**Symptom**: Status 401, 403, or other HTTP errors

**Common Causes**:
- **401 Unauthorized**: Invalid or expired API key
- **403 Forbidden**: Account has insufficient credits or permissions
- **429 Too Many Requests**: Rate limit exceeded (retry mechanism handles this)
- **500 Server Error**: OpenAI service issue (temporary)

**Solutions**:
- Check your OpenAI account status at https://platform.openai.com/account
- Verify billing and credits are active
- Wait and retry if rate limited (automatic with exponential backoff)

### 4. Network/Timeout Issues
**Symptom**: Connection timeout or network error

**Solution**:
- Check Supabase edge function logs
- Verify internet connectivity from edge function
- Increase timeout if needed (default is sufficient for most cases)

## Video Analysis Retry System

### Automatic Retry
- Failed analyses are marked with status "failed"
- Error details are stored in `last_error` field
- Exponential backoff: 2^retryCount seconds (max 5 minutes)

### Manual Retry
1. Go to Video Analysis Dashboard
2. Find failed videos (red "Failed" badge)
3. Click the refresh icon (🔄) to retry
4. Click the alert icon (⚠️) to view error details

### Retry Logic
```
Retry 1: Wait 2 seconds
Retry 2: Wait 4 seconds
Retry 3: Wait 8 seconds
Retry 4: Wait 16 seconds
Retry 5: Wait 32 seconds
Max wait: 300 seconds (5 minutes)
```

## Viewing Error Details

### In Dashboard
- Failed videos show alert icon (⚠️)
- Click icon to see full error message
- Error includes HTTP status and OpenAI response

### In Database
Query the `analyzed_videos` table:
```sql
SELECT 
  video_title,
  analysis_status,
  retry_count,
  last_error,
  last_error_at,
  next_retry_at
FROM analyzed_videos
WHERE analysis_status = 'failed'
ORDER BY last_error_at DESC;
```

## Edge Function Logs

### Viewing Logs
```bash
# Real-time logs
supabase functions logs analyze-video-content --follow

# Recent logs
supabase functions logs analyze-video-content
```

### Key Log Messages
- `=== Video Analysis Started ===`: Analysis initiated
- `OpenAI API Key found`: Key detected (shows first 10 chars)
- `Calling OpenAI API with model: gpt-4o-mini`: API call started
- `OpenAI Response Status: 200`: Success
- `OpenAI Error Response:`: Error details
- `=== Analysis Complete ===`: Success

## Testing OpenAI Connection

### Using Diagnostics Component
1. Navigate to Video Analysis Dashboard
2. Find "OpenAI API Diagnostics" card
3. Click "Run Diagnostics"
4. Review all checks:
   - API Key Exists
   - API Key Format
   - API Connection Test

### Manual Test via Edge Function
```bash
# Invoke test function
curl -X POST \
  https://your-project.supabase.co/functions/v1/test-openai-connection \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Best Practices

### 1. Monitor Credits
- Check OpenAI usage at https://platform.openai.com/usage
- Set up billing alerts
- Monitor daily/monthly spend

### 2. Handle Rate Limits
- System automatically retries with exponential backoff
- Don't manually retry too quickly
- Consider upgrading OpenAI tier if hitting limits frequently

### 3. Error Tracking
- Review failed analyses regularly
- Check for patterns in errors
- Update API key if seeing consistent 401 errors

### 4. Model Selection
- Current: `gpt-4o-mini` (cost-effective)
- Alternative: `gpt-4` (more accurate, higher cost)
- Update in `analyze-video-content` function if needed

## Support Resources

### OpenAI
- Status: https://status.openai.com
- Documentation: https://platform.openai.com/docs
- Support: https://help.openai.com

### Supabase
- Edge Functions Docs: https://supabase.com/docs/guides/functions
- Logs: `supabase functions logs`
- Dashboard: https://app.supabase.com

## Emergency Procedures

### If All Videos Are Failing
1. Run diagnostics tool
2. Check OpenAI status page
3. Verify API key is valid
4. Check billing/credits
5. Review edge function logs
6. Test with simple API call

### If Specific Videos Fail
1. Check video title/description length
2. Review error message for that video
3. Try manual retry
4. Check for special characters or formatting issues

### If Rate Limited
1. Wait for backoff period (shown in `next_retry_at`)
2. Don't manually retry immediately
3. Consider upgrading OpenAI tier
4. Batch process videos with delays

## Monitoring Checklist

✅ Run diagnostics weekly
✅ Check failed analyses daily
✅ Monitor OpenAI credits
✅ Review edge function logs for patterns
✅ Test retry mechanism periodically
✅ Keep API key secure and rotated
