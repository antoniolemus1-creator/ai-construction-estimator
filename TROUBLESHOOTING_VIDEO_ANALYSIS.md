# Video Analysis Troubleshooting Guide

## Error: "Edge Function returned a non-2xx status code"

This error means the edge function exists but is failing. Follow these steps:

### 1. Deploy the Edge Function

```bash
# Navigate to your project root
cd your-project-directory

# Deploy the function
supabase functions deploy analyze-video-content

# Verify deployment
supabase functions list
```

### 2. Set Required Environment Variables

The function requires an OpenAI API key:

```bash
# Set the OpenAI API key
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here

# Verify secrets are set
supabase secrets list
```

### 3. Test the Function

```bash
# Test with sample data
supabase functions invoke analyze-video-content --data '{
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "Test Video",
  "videoDescription": "Test description",
  "userId": "test-user-id",
  "thumbnailUrl": "https://example.com/thumb.jpg"
}'
```

### 4. Check Function Logs

```bash
# View real-time logs
supabase functions logs analyze-video-content --tail

# View recent logs
supabase functions logs analyze-video-content
```

## Common Issues

### Issue: "OpenAI API key not configured"
**Solution**: Set the OPENAI_API_KEY secret (see step 2 above)

### Issue: "Failed to fetch video page"
**Solution**: This is expected - the function will fall back to using the video description for analysis

### Issue: Database errors
**Solution**: Ensure these tables exist:
- analyzed_videos
- training_concepts
- training_questions

Run migrations:
```bash
supabase db reset
```

### Issue: CORS errors
**Solution**: The function already includes CORS headers. If you still see CORS errors, check your Supabase project settings.

## Getting an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and set it using the command in step 2 above

## Alternative: Use Mock Data

If you don't want to use OpenAI, modify the edge function to return mock data instead of calling the API.
