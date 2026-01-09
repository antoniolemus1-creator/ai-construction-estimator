-- ============================================================================
-- TENANTIZATION DATA MIGRATION
-- Populates tenant_id and organization_id for existing records
-- ============================================================================

-- Migrate existing data: set tenant_id = user_id for all records
UPDATE recordings SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE screen_recordings SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE video_annotations SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE workflow_documentation SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE annotations SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE training_jobs SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE training_sessions SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE ai_extraction_settings SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE ai_learning_metrics SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE ai_created_schemas SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE api_usage_tracking SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE api_usage_logs SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE api_usage_stats SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE api_rate_limits SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE api_cost_tracking SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE rate_limit_violations SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE invoices SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE subscriptions SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE extraction_feedback SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE federated_contributions SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE concept_feedback SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE user_contribution_stats SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE system_logs SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE audit_logs SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE function_invocation_logs SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE service_tickets SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE ticket_comments SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE license_users SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE company_branding SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE user_roles SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE cross_reference_history SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE cross_reference_notifications SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE text_search_history SET tenant_id = user_id WHERE tenant_id IS NULL;

UPDATE video_analysis_cache_stats SET tenant_id = user_id WHERE tenant_id IS NULL;
UPDATE model_purchases SET tenant_id = user_id WHERE tenant_id IS NULL;

-- Set organization_id from user_profiles where available
UPDATE recordings r SET organization_id = up.organization_id 
FROM user_profiles up WHERE r.user_id = up.id AND r.organization_id IS NULL;

UPDATE screen_recordings sr SET organization_id = up.organization_id 
FROM user_profiles up WHERE sr.user_id = up.id AND sr.organization_id IS NULL;

UPDATE video_annotations va SET organization_id = up.organization_id 
FROM user_profiles up WHERE va.user_id = up.id AND va.organization_id IS NULL;

UPDATE workflow_documentation wd SET organization_id = up.organization_id 
FROM user_profiles up WHERE wd.user_id = up.id AND wd.organization_id IS NULL;

UPDATE training_jobs tj SET organization_id = up.organization_id 
FROM user_profiles up WHERE tj.user_id = up.id AND tj.organization_id IS NULL;

UPDATE api_usage_tracking aut SET organization_id = up.organization_id 
FROM user_profiles up WHERE aut.user_id = up.id AND aut.organization_id IS NULL;

UPDATE invoices i SET organization_id = up.organization_id 
FROM user_profiles up WHERE i.user_id = up.id AND i.organization_id IS NULL;

UPDATE subscriptions s SET organization_id = up.organization_id 
FROM user_profiles up WHERE s.user_id = up.id AND s.organization_id IS NULL;

UPDATE extraction_feedback ef SET organization_id = up.organization_id 
FROM user_profiles up WHERE ef.user_id = up.id AND ef.organization_id IS NULL;

UPDATE system_logs sl SET organization_id = up.organization_id 
FROM user_profiles up WHERE sl.user_id = up.id AND sl.organization_id IS NULL;

UPDATE service_tickets st SET organization_id = up.organization_id 
FROM user_profiles up WHERE st.user_id = up.id AND st.organization_id IS NULL;
