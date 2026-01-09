# PDF Analysis with Embeddings - Implementation Guide

## Overview
The `analyze-construction-plans` edge function now supports:
- ✅ PDF text extraction by page
- ✅ Embeddings generation using Supabase AI (gte-small, 384 dimensions)
- ✅ Async processing for large PDFs (>10 pages)
- ✅ Semantic search capabilities
- ✅ Multi-tenant RLS security

## Input Formats

### 1. Image Analysis (Existing)
```typescript
const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
  body: {
    imageUrl: 'https://your-storage-url.com/plan.jpg',
    planType: 'construction',
    prompt: 'Extract materials and dimensions'
  }
});
```

### 2. PDF Analysis (New)
```typescript
// First upload PDF to storage
const { data: uploadData } = await supabase.storage
  .from('construction-plans')
  .upload(`plans/${planId}.pdf`, pdfFile);

// Then analyze
const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
  body: {
    planId: 'uuid-of-plan',
    fileType: 'pdf'
  }
});

// Response for large PDFs (>10 pages)
{
  success: true,
  accepted: true,
  message: 'PDF processing started in background',
  planId: 'uuid',
  pageCount: 25
}

// Response for small PDFs
{
  success: true,
  accepted: false,
  message: 'PDF processed successfully',
  planId: 'uuid',
  pageCount: 5
}
```

## Output Data

### OCR Extracted Text Table
```sql
SELECT * FROM ocr_extracted_text WHERE plan_id = 'your-plan-id';
```

Columns:
- `id`: UUID
- `plan_id`: Reference to plans table
- `user_id`: Owner
- `page_number`: Page number in PDF
- `extracted_text`: Full text content
- `embedding`: vector(384) - Semantic embedding
- `extraction_method`: 'pdf_text' or 'vision_ocr'
- `language`: 'en'
- `confidence_score`: 0.0-1.0
- `tenant_id`: Organization ID

### Takeoff Data Table
```sql
SELECT * FROM takeoff_data WHERE plan_id = 'your-plan-id';
```

Structured construction data extracted from analysis.

## Semantic Search

### Using the Search Function
```typescript
// Generate embedding for search query
const { data: embeddingData } = await supabase.functions.invoke('generate-embedding', {
  body: { text: 'concrete specifications' }
});

// Search similar text
const { data: results } = await supabase.rpc('search_plan_text', {
  query_embedding: embeddingData.embedding,
  match_threshold: 0.7,
  match_count: 10
});

// Results include:
// - id, plan_id, page_number, extracted_text, similarity
```

## Performance Considerations

### File Size Limits
- Max PDF size: 50MB
- Large file threshold: 10 pages
- Files >10 pages process asynchronously (202 response)

### Async Processing
For large PDFs:
1. Function returns 202 Accepted immediately
2. Processing continues in background via `EdgeRuntime.waitUntil`
3. Check `plans.status` field for completion
4. Query `ocr_extracted_text` table for results

### Indexes
Performance indexes are automatically created:
```sql
idx_takeoff_data_plan ON takeoff_data(plan_id)
idx_ocr_text_plan ON ocr_extracted_text(plan_id)
idx_ocr_embedding ON ocr_extracted_text USING ivfflat(embedding)
```

## Security (RLS)

All data is protected by Row Level Security:
- Users can only access their own data
- Organization members can access shared data
- Super admins have full access

## Example Workflow

```typescript
// 1. Upload PDF
const file = document.querySelector('input[type="file"]').files[0];
const { data: plan } = await supabase
  .from('plans')
  .insert({
    name: file.name,
    file_type: 'pdf',
    status: 'uploading'
  })
  .select()
  .single();

const { data: uploadData } = await supabase.storage
  .from('construction-plans')
  .upload(`plans/${plan.id}.pdf`, file);

// 2. Update plan with file URL
await supabase
  .from('plans')
  .update({ 
    file_url: uploadData.path,
    status: 'pending_analysis'
  })
  .eq('id', plan.id);

// 3. Analyze PDF
const { data: analysisResult } = await supabase.functions.invoke(
  'analyze-construction-plans',
  {
    body: {
      planId: plan.id,
      fileType: 'pdf'
    }
  }
);

// 4. Check if async
if (analysisResult.accepted) {
  // Poll for completion
  const checkStatus = setInterval(async () => {
    const { data } = await supabase
      .from('plans')
      .select('status')
      .eq('id', plan.id)
      .single();
    
    if (data.status === 'processed') {
      clearInterval(checkStatus);
      // Fetch results
      const { data: ocrData } = await supabase
        .from('ocr_extracted_text')
        .select('*')
        .eq('plan_id', plan.id);
    }
  }, 5000);
}
```

## Troubleshooting

### No embeddings generated
- Check Supabase AI is enabled in your project
- Verify `gte-small` model is available
- Check function logs for embedding errors

### PDF text extraction fails
- Ensure PDF is not encrypted
- Check PDF size is under 50MB
- Verify PDF is not image-only (use vision API instead)

### Slow processing
- Large PDFs process asynchronously
- Check `plans.status` for progress
- Consider splitting large documents

## Next Steps

1. **Enhance Extraction**: Add GPT-4 analysis of extracted text
2. **Improve Parser**: Integrate robust PDF parser (pdf-parse npm package)
3. **Add Caching**: Cache embeddings for frequently accessed pages
4. **Batch Processing**: Support multiple PDFs in one request
