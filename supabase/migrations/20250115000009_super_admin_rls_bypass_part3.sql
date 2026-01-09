-- ============================================================================
-- SUPER ADMIN RLS BYPASS - PART 3
-- Final tables and INSERT/UPDATE/DELETE policies
-- ============================================================================

-- Invoices
DROP POLICY IF EXISTS invoices_select ON invoices;
CREATE POLICY invoices_select ON invoices FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Subscriptions
DROP POLICY IF EXISTS subscriptions_select ON subscriptions;
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Extraction Feedback
DROP POLICY IF EXISTS extraction_feedback_select ON extraction_feedback;
CREATE POLICY extraction_feedback_select ON extraction_feedback FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- System Logs
DROP POLICY IF EXISTS system_logs_select ON system_logs;
CREATE POLICY system_logs_select ON system_logs FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Service Tickets
DROP POLICY IF EXISTS service_tickets_select ON service_tickets;
CREATE POLICY service_tickets_select ON service_tickets FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Company Branding
DROP POLICY IF EXISTS company_branding_select ON company_branding;
CREATE POLICY company_branding_select ON company_branding FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Add super admin bypass to INSERT/UPDATE/DELETE policies
-- Super admins can modify any data
