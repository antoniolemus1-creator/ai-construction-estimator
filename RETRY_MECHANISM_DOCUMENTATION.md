# Video Analysis Retry Mechanism

## Overview
The video analysis system now includes automatic retry functionality with exponential backoff for failed analysis attempts.

## Features

### 1. Retry Tracking
- **retry_count**: Number of retry attempts
- **last_error**: Detailed error message from OpenAI API
- **last_error_at**: Timestamp of last error
- **next_retry_at**: Calculated next retry time with exponential backoff
- **analysis_status**: Current status (pending, processing, completed, failed, retrying)

### 2. Exponential Backoff
The system uses exponential backoff to prevent API rate limit issues:
- Retry 1: 2 seconds delay
- Retry 2: 4 seconds delay
- Retry 3: 8 seconds delay
- Retry 4: 16 seconds delay
- Maximum delay: 5 minutes (300 seconds)

Formula: `delay = min(2^retryCount, 300) seconds`

### 3. Error Handling
- Captures HTTP status codes and error messages
- Stores detailed error information for debugging
- Displays user-friendly error messages in the UI
- Provides error details on hover/click

### 4. Dashboard UI
- **Status Badge**: Visual indicator of analysis status
  - Green: Completed
  - Blue: Processing
  - Red: Failed
  - Yellow: Retrying
  - Gray: Pending
  
- **Retry Button**: Manual retry for failed analyses
  - Appears only for failed videos
  - Shows loading spinner during retry
  - Increments retry count automatically

- **Error Details**: Alert icon to view error messages
  - Click to display full error in toast notification
  - Helps debug OpenAI API issues

## Usage

### Manual Retry
1. Navigate to Video Analysis Dashboard
2. Find videos with "Failed" status
3. Click the retry button (circular arrow icon)
4. System will attempt analysis with incremented retry count

### Automatic Retry
The edge function automatically tracks retries:
```typescript
const { data, error } = await supabase.functions.invoke('analyze-video-content', {
  body: {
    videoId: 'video_id',
    videoTitle: 'Video Title',
    userId: 'user_id',
    isRetry: true  // Triggers retry logic
  }
});
```

## Database Schema

```sql
ALTER TABLE analyzed_videos 
ADD COLUMN retry_count INTEGER DEFAULT 0,
ADD COLUMN last_error TEXT,
ADD COLUMN last_error_at TIMESTAMPTZ,
ADD COLUMN next_retry_at TIMESTAMPTZ,
ADD COLUMN analysis_status TEXT DEFAULT 'pending';
```

## Error Messages
Common OpenAI API errors:
- **429**: Rate limit exceeded (automatic backoff applied)
- **401**: Invalid API key
- **500**: OpenAI server error
- **503**: Service temporarily unavailable

## Best Practices
1. Monitor retry counts - high counts indicate persistent issues
2. Check error messages for API key or configuration problems
3. Use exponential backoff to respect rate limits
4. Set maximum retry attempts to prevent infinite loops
5. Log all errors for debugging and monitoring
