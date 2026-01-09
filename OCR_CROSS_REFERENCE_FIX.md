# OCR and Cross-Reference Edge Functions Fix

## Issues Fixed

### 1. extract-text-ocr Function
**Problems:**
- Manual fetch-based authentication was failing
- Missing proper Supabase client initialization
- No multi-tenant support (organization_id, tenant_id)
- Inadequate error handling and logging
- Not returning proper status codes in all error cases

**Solutions:**
- ✅ Implemented proper Supabase client with `createClient`
- ✅ Added authentication with `supabaseClient.auth.getUser()`
- ✅ Fetch plan data to get organization_id and tenant_id
- ✅ Store OCR data with multi-tenant fields
- ✅ Enhanced error logging with console.log statements
- ✅ All error responses include CORS headers and proper status codes
- ✅ Validate OpenAI response before processing

### 2. cross-reference-specs-drawings Function
**Problems:**
- Missing authentication check
- No validation of OpenAI API responses
- Referenced non-existent tables (cross_reference_history, cross_reference_notifications)
- Poor error handling for fetch operations
- Missing CORS headers in some error paths

**Solutions:**
- ✅ Implemented proper Supabase client authentication
- ✅ Added validation for all API responses
- ✅ Removed references to non-existent tables
- ✅ Store cross-reference results in plans.extracted_data field
- ✅ Enhanced error logging throughout
- ✅ All responses include proper CORS headers
- ✅ Return detailed summary of analysis results

## Key Improvements

### Authentication Flow
Both functions now:
1. Initialize Supabase client with user's auth token
2. Validate user authentication before processing
3. Fetch plan data to verify access and get tenant info
4. Return 401 Unauthorized if auth fails

### Error Handling
All error responses now include:
- Proper HTTP status codes (400, 401, 404, 500)
- CORS headers for cross-origin requests
- Detailed error messages
- Stack traces for debugging (in 500 errors)

### Multi-Tenant Support
OCR function now stores:
- `organization_id` from plan
- `tenant_id` from plan
- Proper RLS will enforce access control

### Logging
Both functions include comprehensive logging:
- Request parameters
- Authentication status
- API call results
- Database operation results
- Error details with stack traces

## Testing

### Test OCR Extraction
```javascript
const { data, error } = await supabase.functions.invoke('extract-text-ocr', {
  body: {
    planId: 'your-plan-id',
    imageUrl: 'https://your-image-url.com/image.jpg',
    pageNumber: 1
  }
});
```

### Test Cross-Reference
```javascript
const { data, error } = await supabase.functions.invoke('cross-reference-specs-drawings', {
  body: {
    planId: 'your-plan-id'
  }
});
```

## Expected Responses

### OCR Success Response
```json
{
  "success": true,
  "ocrId": "uuid",
  "extractedText": "Full text content...",
  "pageNumber": 1,
  "textLength": 5432
}
```

### Cross-Reference Success Response
```json
{
  "success": true,
  "analysis": {
    "matches": [...],
    "discrepancies": [...],
    "unmatchedTakeoff": [...],
    "unmatchedSpecs": [...],
    "recommendations": [...]
  },
  "summary": {
    "totalMatches": 5,
    "totalDiscrepancies": 2,
    "unmatchedTakeoffCount": 1,
    "unmatchedSpecsCount": 3
  }
}
```

## Database Schema Requirements

### ocr_extracted_text table must have:
- plan_id (uuid, FK to plans)
- organization_id (uuid)
- tenant_id (uuid)
- page_number (integer)
- extracted_text (text)
- confidence_score (numeric)
- extraction_method (text)
- metadata (jsonb)

### plans table must have:
- id (uuid)
- organization_id (uuid)
- tenant_id (uuid)
- user_id (uuid)
- extracted_data (jsonb)

## Next Steps

1. ✅ Functions deployed and ready to test
2. Test OCR extraction with real plan images
3. Test cross-reference with plans that have takeoff data
4. Monitor edge function logs for any remaining issues
5. Verify RLS policies allow proper data access

## Troubleshooting

If you still see errors:

1. **Check Authentication**: Ensure user is logged in and token is valid
2. **Verify Plan Access**: User must have access to the plan (RLS policies)
3. **Check OpenAI API Key**: Verify OPENAI_API_KEY is set in Supabase secrets
4. **Review Logs**: Check Supabase edge function logs for detailed error messages
5. **Validate Image URLs**: Ensure image URLs are publicly accessible for OpenAI Vision API
