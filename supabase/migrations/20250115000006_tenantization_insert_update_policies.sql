-- ============================================================================
-- TENANTIZATION INSERT/UPDATE/DELETE POLICIES
-- Allows users to modify their own data and org data (with proper roles)
-- ============================================================================

-- INSERT policies (set tenant_id automatically)
CREATE POLICY recordings_insert ON recordings FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY screen_recordings_insert ON screen_recordings FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY video_annotations_insert ON video_annotations FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY workflow_documentation_insert ON workflow_documentation FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY annotations_insert ON annotations FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY training_jobs_insert ON training_jobs FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY training_sessions_insert ON training_sessions FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY ai_extraction_settings_insert ON ai_extraction_settings FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY ai_learning_metrics_insert ON ai_learning_metrics FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY ai_created_schemas_insert ON ai_created_schemas FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY api_usage_tracking_insert ON api_usage_tracking FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY extraction_feedback_insert ON extraction_feedback FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY service_tickets_insert ON service_tickets FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY company_branding_insert ON company_branding FOR INSERT WITH CHECK (
  tenant_id = auth.uid()
);

-- UPDATE policies (users can update their own data)
CREATE POLICY recordings_update ON recordings FOR UPDATE USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
) WITH CHECK (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY screen_recordings_update ON screen_recordings FOR UPDATE USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
) WITH CHECK (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY video_annotations_update ON video_annotations FOR UPDATE USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
) WITH CHECK (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY workflow_documentation_update ON workflow_documentation FOR UPDATE USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
) WITH CHECK (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY training_jobs_update ON training_jobs FOR UPDATE USING (
  tenant_id = auth.uid()
) WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY ai_extraction_settings_update ON ai_extraction_settings FOR UPDATE USING (
  tenant_id = auth.uid()
) WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY extraction_feedback_update ON extraction_feedback FOR UPDATE USING (
  tenant_id = auth.uid()
) WITH CHECK (
  tenant_id = auth.uid()
);

CREATE POLICY service_tickets_update ON service_tickets FOR UPDATE USING (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
) WITH CHECK (
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

CREATE POLICY company_branding_update ON company_branding FOR UPDATE USING (
  tenant_id = auth.uid()
) WITH CHECK (
  tenant_id = auth.uid()
);

-- DELETE policies (users can delete their own data)
CREATE POLICY recordings_delete ON recordings FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY screen_recordings_delete ON screen_recordings FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY video_annotations_delete ON video_annotations FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY workflow_documentation_delete ON workflow_documentation FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY annotations_delete ON annotations FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY training_jobs_delete ON training_jobs FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY ai_extraction_settings_delete ON ai_extraction_settings FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY extraction_feedback_delete ON extraction_feedback FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY service_tickets_delete ON service_tickets FOR DELETE USING (
  tenant_id = auth.uid()
);

CREATE POLICY company_branding_delete ON company_branding FOR DELETE USING (
  tenant_id = auth.uid()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recordings_tenant_id ON recordings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recordings_organization_id ON recordings(organization_id);
CREATE INDEX IF NOT EXISTS idx_screen_recordings_tenant_id ON screen_recordings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_screen_recordings_organization_id ON screen_recordings(organization_id);
CREATE INDEX IF NOT EXISTS idx_video_annotations_tenant_id ON video_annotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_tenant_id ON training_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_tenant_id ON api_usage_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_extraction_feedback_tenant_id ON extraction_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_tenant_id ON service_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON subscriptions(tenant_id);
