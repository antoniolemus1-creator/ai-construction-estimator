# AI Learning Video Analysis Troubleshooting Guide

## Issue: No Videos Showing as Analyzed

### What Was Fixed:

1. **Database Table Structure**
   - Recreated `analyzed_videos` table with proper columns
   - Added unique constraint on (user_id, video_id) to prevent duplicates
   - Created proper indexes for performance

2. **Row Level Security (RLS) Policies**
   - Added service role policy to allow edge functions to insert
   - Maintained user policies for viewing and deleting their own data

3. **Edge Function Error Handling**
   - Enhanced `analyze-video-content` function with detailed logging
   - Added proper error responses with stack traces
   - Improved validation of input parameters

4. **Frontend Error Display**
   - Updated `YouTubeTrainingVideos` component to show detailed errors
   - Added console logging for debugging
   - Display concept count in success message

## How to Test:

1. **Go to Training page** (http://localhost:5173/training)
2. **Add a YouTube video** using the URL input
3. **Click "Analyze with AI"** on any video card
4. **Check browser console** for detailed logs:
   - Analysis progress
   - Concept counts
   - Any errors

5. **Verify in Analysis History**:
   - Navigate to Analysis History page
   - Should see analyzed videos with timestamps
   - Click "View Details" to see extracted concepts

## Debugging Steps:

If videos still don't appear:

1. **Check Browser Console** for errors during analysis
2. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Edge Functions → analyze-video-content
   - View function logs for detailed error messages

3. **Verify User Authentication**:
   - Ensure you're logged in
   - Check that user.id is being passed correctly

4. **Test Database Directly**:
   ```sql
   SELECT * FROM analyzed_videos WHERE user_id = 'your-user-id';
   ```

5. **Check OpenAI API**:
   - Verify OPENAI_API_KEY is set in Supabase secrets
   - Check if API has sufficient credits

## Common Issues:

- **"Please sign in to analyze videos"**: User not authenticated
- **"OpenAI API error"**: API key missing or invalid
- **"Failed to store video"**: Database permission issue
- **Silent failure**: Check Supabase function logs

## Success Indicators:

✅ Toast message: "Video analyzed! Found X concepts"
✅ Video appears in "Analyzed" section
✅ Analysis History page shows the video
✅ Can view detailed analysis results
