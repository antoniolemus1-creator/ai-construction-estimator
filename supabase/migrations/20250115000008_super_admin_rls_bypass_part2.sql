-- ============================================================================
-- SUPER ADMIN RLS BYPASS - PART 2
-- Continue updating policies for remaining tables
-- ============================================================================

-- Training Jobs
DROP POLICY IF EXISTS training_jobs_select ON training_jobs;
CREATE POLICY training_jobs_select ON training_jobs FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Training Sessions
DROP POLICY IF EXISTS training_sessions_select ON training_sessions;
CREATE POLICY training_sessions_select ON training_sessions FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- AI Extraction Settings
DROP POLICY IF EXISTS ai_extraction_settings_select ON ai_extraction_settings;
CREATE POLICY ai_extraction_settings_select ON ai_extraction_settings FOR SELECT USING (
  is_super_admin() OR tenant_id = auth.uid()
);

-- AI Learning Metrics
DROP POLICY IF EXISTS ai_learning_metrics_select ON ai_learning_metrics;
CREATE POLICY ai_learning_metrics_select ON ai_learning_metrics FOR SELECT USING (
  is_super_admin() OR tenant_id = auth.uid()
);

-- AI Created Schemas
DROP POLICY IF EXISTS ai_created_schemas_select ON ai_created_schemas;
CREATE POLICY ai_created_schemas_select ON ai_created_schemas FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- API Usage Tracking
DROP POLICY IF EXISTS api_usage_tracking_select ON api_usage_tracking;
CREATE POLICY api_usage_tracking_select ON api_usage_tracking FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- API Usage Logs
DROP POLICY IF EXISTS api_usage_logs_select ON api_usage_logs;
CREATE POLICY api_usage_logs_select ON api_usage_logs FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);
