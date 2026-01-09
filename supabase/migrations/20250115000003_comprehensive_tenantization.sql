-- ============================================================================
-- COMPREHENSIVE TENANTIZATION MIGRATION
-- Adds tenant_id and organization_id to all user-owned tables
-- Implements strict RLS policies for multi-tenant isolation
-- ============================================================================

-- PART 1: Add tenant_id and organization_id columns to tables that need them
-- ============================================================================

-- User-owned content tables
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE screen_recordings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE screen_recordings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE video_annotations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE video_annotations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE workflow_documentation ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE workflow_documentation ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE annotations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Training and AI tables
ALTER TABLE training_jobs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE training_jobs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE ai_extraction_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE ai_extraction_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE ai_learning_metrics ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE ai_learning_metrics ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE ai_created_schemas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE ai_created_schemas ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- API usage and tracking
ALTER TABLE api_usage_tracking ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE api_usage_tracking ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE api_usage_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE api_usage_stats ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE api_usage_stats ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE api_rate_limits ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE api_rate_limits ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE api_cost_tracking ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE api_cost_tracking ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE rate_limit_violations ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE rate_limit_violations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Billing and subscriptions
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Feedback and contributions
ALTER TABLE extraction_feedback ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE extraction_feedback ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE federated_contributions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE federated_contributions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE concept_feedback ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE concept_feedback ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE user_contribution_stats ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE user_contribution_stats ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Logs and auditing
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE function_invocation_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE function_invocation_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Service and support
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE service_tickets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE ticket_comments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- License management
ALTER TABLE license_users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE license_users ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- User settings and branding
ALTER TABLE company_branding ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE company_branding ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Cross-reference and search
ALTER TABLE cross_reference_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE cross_reference_history ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE cross_reference_notifications ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE cross_reference_notifications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

ALTER TABLE text_search_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE text_search_history ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Video analysis
ALTER TABLE video_analysis_cache_stats ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE video_analysis_cache_stats ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Model marketplace
ALTER TABLE model_purchases ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id);
ALTER TABLE model_purchases ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Procore integration (if exists)
ALTER TABLE procore_connections ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES auth.users(id) IF EXISTS;
ALTER TABLE procore_connections ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) IF EXISTS;
