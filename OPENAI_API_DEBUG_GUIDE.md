# OpenAI API Debug Guide for Video Analysis

## Overview
This guide documents the enhanced error handling and retry logic implemented in the `analyze-video-content` edge function to handle OpenAI API failures gracefully.

## Key Improvements Implemented

### 1. Retry Logic with Exponential Backoff
- **Max Retries**: 3 attempts
- **Initial Delay**: 1 second
- **Max Delay**: 10 seconds
- **Backoff Strategy**: Exponential (delay doubles with each retry)

### 2. Request Timeout Handling
- **Timeout Duration**: 30 seconds per request
- **Behavior**: Automatically aborts and retries if request hangs

### 3. API Key Validation
- Validates key format (must start with 'sk-' and be >40 chars)
- Provides clear error message if key is invalid or missing

### 4. Rate Limit Handling
- Detects 429 status codes
- Respects `retry-after` header when present
- Uses exponential backoff when header not available
- Clear user messaging about rate limits

### 5. Error Response Parsing
- Extracts meaningful error messages from OpenAI responses
- Provides context-specific error messages for users
- Maintains detailed logging for debugging

## Error Types and Handling

### Authentication Errors (401/403)
- **Message**: "Authentication failed: [details]. Please check your OpenAI API key configuration."
- **Action**: No retry, immediate failure
- **User Guidance**: Contact support to verify API key

### Rate Limits (429)
- **Message**: "Rate limit exceeded. Please try again in X seconds."
- **Action**: Automatic retry with backoff
- **User Guidance**: Wait and retry

### Quota Exceeded (402)
- **Message**: "OpenAI API quota exceeded. Please check your billing status."
- **Action**: No retry, immediate failure
- **User Guidance**: Contact support for quota issues

### Server Errors (500+)
- **Message**: "OpenAI server error. Retrying..."
- **Action**: Automatic retry with backoff
- **User Guidance**: Automatic handling

### Timeout Errors
- **Message**: "The analysis request timed out. The video might be too complex."
- **Action**: Retry with same timeout
- **User Guidance**: Try shorter videos or retry later

## Frontend Error Handling

The frontend now provides:
1. User-friendly error messages based on error type
2. Specific guidance for each error scenario
3. Retry button in error toast notifications
4. Detailed console logging for debugging

## Testing the Implementation

### Test API Key Validation
```javascript
// Edge function will validate and log:
// "OpenAI key validated: sk-proj...abcd"
```

### Test Rate Limit Handling
The function will automatically retry up to 3 times with exponential backoff.

### Test Timeout Handling
Long-running requests will timeout after 30 seconds and retry automatically.

## Monitoring and Debugging

### Edge Function Logs
Check Supabase dashboard logs for:
- API attempt numbers
- Rate limit delays
- Error types and messages
- Retry attempts
- Final success/failure status

### Browser Console
Frontend logs include:
- Request/response details
- Error types and messages
- Stack traces for debugging

## Common Issues and Solutions

### Issue: "Edge Function returned a non-2xx status code"
**Solution**: Check edge function logs for specific error details

### Issue: Repeated rate limit errors
**Solution**: Implement request queuing or reduce analysis frequency

### Issue: Timeout errors on all videos
**Solution**: Check OpenAI API status or reduce request complexity

## Environment Variables Required
- `OPENAI_API_KEY`: Must be a valid OpenAI API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

## Next Steps for Further Improvement

1. **Request Queuing**: Implement a queue system to prevent rate limits
2. **Caching**: Cache analysis results to reduce API calls
3. **Fallback Models**: Use gpt-3.5-turbo as fallback if gpt-4o fails
4. **Progress Indicators**: Show analysis progress to users
5. **Batch Processing**: Optimize bulk analysis with concurrent limits