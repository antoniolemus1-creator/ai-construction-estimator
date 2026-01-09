# Federated Learning System Guide

## Overview
The federated learning system continuously improves AI extraction accuracy by collecting feedback from all users, aggregating insights, and updating the model's understanding of construction documents.

## System Components

### 1. Data Collection
- **Extraction Feedback**: Users rate extraction accuracy and provide corrections
- **Clarification Answers**: Users answer AI questions about missing information
- **Usage Patterns**: System tracks which fields are commonly missing or misunderstood

### 2. Database Tables

#### model_versions
Tracks different versions of the extraction model:
- `version_number`: Semantic version (v1.0.0, v1.1.0, etc.)
- `prompt_template`: The extraction prompt used
- `extraction_accuracy`: Overall accuracy percentage
- `clarification_rate`: Percentage of extractions needing clarification
- `is_active`: Currently active model

#### training_insights
Aggregated patterns discovered from user feedback:
- `insight_type`: Type of pattern (common_missing_field, terminology_pattern, scale_format)
- `category`: drawings, specifications, metadata
- `pattern_data`: JSON with specific pattern details
- `occurrence_count`: How many times this pattern was observed
- `confidence_score`: Confidence in this insight (0-100)
- `applied_to_model`: Whether this insight is being used

#### extraction_metrics
Daily performance metrics:
- `metric_date`: Date of metrics
- `total_extractions`: Number of extractions performed
- `successful_extractions`: Extractions with no clarifications needed
- `clarifications_needed`: Number of clarification questions generated
- `avg_extraction_time_ms`: Average processing time
- `avg_confidence_score`: Average AI confidence

### 3. Aggregation Process

The `aggregate-federated-learning` Edge Function runs periodically to:

1. **Collect Feedback**: Gathers all helpful feedback and answered clarifications
2. **Analyze Patterns**: Identifies common issues:
   - Fields frequently missing (deck heights, wall types, scales)
   - Terminology variations (drywall vs gypsum board)
   - Scale format patterns (imperial vs metric)
3. **Generate Insights**: Creates training_insights records with confidence scores
4. **Update Prompts**: High-confidence insights are incorporated into extraction prompts
5. **Track Metrics**: Records performance improvements over time

### 4. Model Improvement Cycle

```
User Extracts Document
    ↓
AI Analyzes with Current Model
    ↓
Missing Info Detected → Clarification Questions
    ↓
User Answers Questions
    ↓
Feedback Collected (marked for training)
    ↓
Aggregation Job Runs (periodic)
    ↓
Patterns Identified → Insights Generated
    ↓
High-Confidence Insights Applied to Model
    ↓
New Model Version Created
    ↓
Improved Extraction Accuracy
```

## Usage

### For Users

1. **Upload Plans**: Use the Plan Upload Wizard
2. **Answer Questions**: When AI asks for clarification, provide accurate answers
3. **Provide Feedback**: Rate extraction accuracy and note any errors
4. **Enable Learning**: Opt-in to federated learning in account settings

### For Admins

1. **View Dashboard**: Navigate to `/federated-learning`
2. **Run Aggregation**: Click "Run Aggregation" to process new feedback
3. **Review Insights**: Check training insights for patterns
4. **Monitor Performance**: Track accuracy improvements over time
5. **Manage Versions**: Review model version history

### Running Aggregation

Manual trigger:
```typescript
const { data } = await supabase.functions.invoke('aggregate-federated-learning');
```

Automated (recommended): Set up a cron job to run daily:
```sql
SELECT cron.schedule(
  'aggregate-federated-learning',
  '0 2 * * *', -- 2 AM daily
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/aggregate-federated-learning',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## Privacy & Security

- **Opt-In**: Users must enable `allow_shared_learning` in their profile
- **Anonymization**: Personal project details are not shared
- **Aggregation**: Only patterns and statistics are collected, not raw documents
- **Local Learning**: Each user's corrections improve their own extractions immediately
- **Federated Insights**: Aggregated patterns improve the model for all users

## Metrics Tracked

### Accuracy Metrics
- Extraction success rate (no clarifications needed)
- Field-level accuracy (correct vs incorrect extractions)
- Confidence scores over time

### Learning Metrics
- Number of training insights generated
- Insights applied to model
- User feedback volume
- Clarification question volume

### Performance Metrics
- Average extraction time
- API response times
- Model inference speed

## Best Practices

1. **Answer Clarifications Accurately**: Your answers train the model
2. **Provide Detailed Feedback**: Specific feedback generates better insights
3. **Review Extracted Data**: Verify accuracy before using in estimates
4. **Enable Federated Learning**: Help improve the system for everyone
5. **Run Aggregation Regularly**: Daily or weekly for best results

## Troubleshooting

### Low Accuracy
- Check if insights are being applied to model
- Review common_issues in extraction_metrics
- Verify OpenAI API is responding correctly

### No Insights Generated
- Ensure users are providing feedback
- Check that clarification questions are being answered
- Verify aggregation job is running

### Slow Extraction
- Check avg_extraction_time_ms in metrics
- Consider reducing max_tokens if too high
- Monitor OpenAI API rate limits

## Future Enhancements

- **Auto-versioning**: Automatically create new model versions when accuracy improves
- **A/B Testing**: Test multiple prompt variations
- **Fine-tuning**: Use collected data to fine-tune custom models
- **Specialized Models**: Separate models for different drawing types
- **Real-time Learning**: Apply insights immediately without aggregation delay
