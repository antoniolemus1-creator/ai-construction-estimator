# Function Monitoring System

## Overview
The function monitoring system tracks all invocations of the `analyze-video-content` edge function, providing detailed insights into performance, errors, and OpenAI API usage.

## Features

### 1. Automatic Logging
Every function invocation is automatically logged with:
- **Status**: success, error, timeout, rate_limited
- **Duration**: Execution time in milliseconds
- **OpenAI Metrics**: Tokens used and estimated cost
- **Retry Count**: Number of retry attempts
- **Error Details**: Error messages and types
- **Request/Response Data**: Full context for debugging

### 2. Real-time Dashboard
Access the monitoring dashboard at: **AI Learning System → Monitoring Tab**

The dashboard displays:
- **Total Invocations**: Count of all function calls
- **Success Rate**: Percentage of successful executions
- **Average Duration**: Mean execution time
- **OpenAI Usage**: Total tokens and costs
- **Recent Invocations**: Last 100 calls with details

### 3. Time Range Filters
View metrics for different time periods:
- 1 Hour
- 24 Hours
- 7 Days
- 30 Days

## Database Tables

### function_invocation_logs
Stores individual function call logs:
```sql
- id: UUID
- function_name: TEXT
- user_id: UUID
- video_id: TEXT
- status: TEXT (success/error/timeout/rate_limited)
- duration_ms: INTEGER
- error_message: TEXT
- error_type: TEXT
- openai_model: TEXT
- openai_tokens_used: INTEGER
- openai_cost_usd: DECIMAL
- retry_count: INTEGER
- request_params: JSONB
- response_data: JSONB
- created_at: TIMESTAMPTZ
```

### function_metrics_summary
Aggregated daily metrics (for future use):
```sql
- function_name: TEXT
- date: DATE
- total_invocations: INTEGER
- successful_invocations: INTEGER
- failed_invocations: INTEGER
- avg_duration_ms: INTEGER
- total_openai_tokens: INTEGER
- total_openai_cost_usd: DECIMAL
- unique_users: INTEGER
```

## Cost Tracking

### GPT-4o Pricing (per 1M tokens)
- Input tokens: $2.50
- Output tokens: $10.00

The system automatically calculates costs for each API call based on actual token usage.

## Monitoring Best Practices

1. **Check Success Rate**: Should be >95% under normal conditions
2. **Monitor Costs**: Track daily OpenAI spending
3. **Watch for Rate Limits**: Indicates high usage or API issues
4. **Review Errors**: Investigate recurring error patterns
5. **Track Duration**: Identify performance degradation

## Troubleshooting

### High Error Rate
- Check OpenAI API key permissions
- Verify API quota hasn't been exceeded
- Review error messages in logs

### Slow Performance
- Check average duration trends
- Look for timeout errors
- Consider optimizing prompts

### Rate Limiting
- Implement request throttling
- Upgrade OpenAI plan if needed
- Add exponential backoff (already implemented)

## Security

- Row Level Security (RLS) enabled
- Users can only view their own logs
- Service role has full access for logging
- No sensitive data in logs (API keys excluded)

## Future Enhancements

1. **Alerts**: Email notifications for high error rates
2. **Aggregation**: Automatic daily metric summaries
3. **Trends**: Historical charts and analysis
4. **Budgets**: Cost alerts and limits
5. **Performance**: Query optimization recommendations
