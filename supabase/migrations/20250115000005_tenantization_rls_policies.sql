-- ============================================================================
-- TENANTIZATION RLS POLICIES
-- Implements strict multi-tenant isolation policies
-- ============================================================================

-- Drop existing policies that might conflict
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_extraction_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_created_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE federated_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contribution_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_invocation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_reference_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_reference_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analysis_cache_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_purchases ENABLE ROW LEVEL SECURITY;

-- Create helper function for organization access
CREATE OR REPLACE FUNCTION user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create SELECT policies (users can view their own data or org data)
CREATE POLICY recordings_select ON recordings FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY screen_recordings_select ON screen_recordings FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY video_annotations_select ON video_annotations FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY workflow_documentation_select ON workflow_documentation FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY annotations_select ON annotations FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY training_jobs_select ON training_jobs FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY training_sessions_select ON training_sessions FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY ai_extraction_settings_select ON ai_extraction_settings FOR SELECT USING (
  tenant_id = auth.uid()
);

CREATE POLICY ai_learning_metrics_select ON ai_learning_metrics FOR SELECT USING (
  tenant_id = auth.uid()
);

CREATE POLICY ai_created_schemas_select ON ai_created_schemas FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY api_usage_tracking_select ON api_usage_tracking FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY api_usage_logs_select ON api_usage_logs FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY api_usage_stats_select ON api_usage_stats FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY invoices_select ON invoices FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY extraction_feedback_select ON extraction_feedback FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY system_logs_select ON system_logs FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY service_tickets_select ON service_tickets FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY company_branding_select ON company_branding FOR SELECT USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);
