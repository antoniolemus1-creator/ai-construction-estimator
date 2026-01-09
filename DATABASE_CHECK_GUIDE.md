# Database Check Guide for OpenAI Video Analysis

## Quick Database Queries

Run these in your Supabase SQL Editor to check for analyzed video data:

### 1. Check if tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('analyzed_videos', 'ai_learning_questions', 'ai_learning_metrics');
```

### 2. Count total analyzed videos
```sql
SELECT COUNT(*) as total_videos FROM analyzed_videos;
```

### 3. Check your user's analyzed videos
```sql
-- Replace 'YOUR_USER_ID' with your actual user ID
SELECT 
  id,
  video_id,
  video_title,
  concepts_count,
  status,
  created_at,
  analysis_results IS NOT NULL as has_analysis
FROM analyzed_videos 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

### 4. View analysis results details
```sql
SELECT 
  video_title,
  analysis_results->'concepts' as concepts,
  analysis_results->'keyTakeaways' as takeaways,
  analysis_results->'practiceQuestions' as questions
FROM analyzed_videos 
WHERE user_id = 'YOUR_USER_ID'
AND analysis_results IS NOT NULL
LIMIT 5;
```

### 5. Check AI learning metrics
```sql
SELECT * FROM ai_learning_metrics WHERE user_id = 'YOUR_USER_ID';
```

### 6. Check AI learning questions
```sql
SELECT 
  question_text,
  status,
  confidence_score,
  created_at
FROM ai_learning_questions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

## Common Issues and Solutions

### Issue: No data in analyzed_videos table
**Possible causes:**
1. Video analysis hasn't been run yet
2. OpenAI API key not configured
3. Edge function errors
4. RLS policies blocking access

**Solutions:**
- Run the Video Analysis Diagnostics tool in the app
- Check Supabase function logs: `supabase functions logs analyze-video-content`
- Verify OpenAI API key is set in Supabase secrets
- Check RLS policies are correct (see migration file)

### Issue: analysis_results is NULL
**Possible causes:**
1. Analysis failed but row was created
2. OpenAI API returned error
3. Edge function didn't complete

**Solutions:**
- Check function logs for errors
- Re-run analysis for the video
- Verify OpenAI API key has credits

### Issue: Can't see data in app but it's in database
**Possible causes:**
1. RLS policies blocking access
2. User ID mismatch
3. Frontend query error

**Solutions:**
- Verify you're logged in as the correct user
- Check browser console for errors
- Run query with your actual user_id to verify data exists

## How to Get Your User ID

Run this query while logged in:
```sql
SELECT auth.uid() as my_user_id;
```

Or check in the app's browser console:
```javascript
// In browser console
supabase.auth.getUser().then(({data}) => console.log(data.user.id))
```
