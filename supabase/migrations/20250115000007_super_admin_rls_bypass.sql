-- ============================================================================
-- SUPER ADMIN RLS BYPASS
-- Allows super-admins to read/write all data without RLS restrictions
-- ============================================================================

-- Helper function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (role = 'super_admin' OR user_type = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update all SELECT policies to include super admin bypass
-- Format: (existing_policy) OR is_super_admin()

-- Recordings
DROP POLICY IF EXISTS recordings_select ON recordings;
CREATE POLICY recordings_select ON recordings FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Screen Recordings
DROP POLICY IF EXISTS screen_recordings_select ON screen_recordings;
CREATE POLICY screen_recordings_select ON screen_recordings FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Video Annotations
DROP POLICY IF EXISTS video_annotations_select ON video_annotations;
CREATE POLICY video_annotations_select ON video_annotations FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Workflow Documentation
DROP POLICY IF EXISTS workflow_documentation_select ON workflow_documentation;
CREATE POLICY workflow_documentation_select ON workflow_documentation FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);

-- Annotations
DROP POLICY IF EXISTS annotations_select ON annotations;
CREATE POLICY annotations_select ON annotations FOR SELECT USING (
  is_super_admin() OR
  tenant_id = auth.uid() OR 
  (organization_id IS NOT NULL AND user_has_org_access(organization_id))
);
