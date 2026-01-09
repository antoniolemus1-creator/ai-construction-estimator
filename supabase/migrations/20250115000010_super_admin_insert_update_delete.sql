-- ============================================================================
-- SUPER ADMIN INSERT/UPDATE/DELETE BYPASS
-- Allows super-admins to insert, update, and delete any data
-- ============================================================================

-- Add super admin bypass to INSERT policies
DROP POLICY IF EXISTS recordings_insert ON recordings;
CREATE POLICY recordings_insert ON recordings FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = auth.uid()
);

DROP POLICY IF EXISTS screen_recordings_insert ON screen_recordings;
CREATE POLICY screen_recordings_insert ON screen_recordings FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = auth.uid()
);

DROP POLICY IF EXISTS video_annotations_insert ON video_annotations;
CREATE POLICY video_annotations_insert ON video_annotations FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = auth.uid()
);

DROP POLICY IF EXISTS service_tickets_insert ON service_tickets;
CREATE POLICY service_tickets_insert ON service_tickets FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = auth.uid()
);

-- Add super admin bypass to UPDATE policies
DROP POLICY IF EXISTS recordings_update ON recordings;
CREATE POLICY recordings_update ON recordings FOR UPDATE USING (
  is_super_admin() OR tenant_id = auth.uid()
) WITH CHECK (
  is_super_admin() OR tenant_id = auth.uid()
);

DROP POLICY IF EXISTS screen_recordings_update ON screen_recordings;
CREATE POLICY screen_recordings_update ON screen_recordings FOR UPDATE USING (
  is_super_admin() OR tenant_id = auth.uid()
) WITH CHECK (
  is_super_admin() OR tenant_id = auth.uid()
);

DROP POLICY IF EXISTS video_annotations_update ON video_annotations;
CREATE POLICY video_annotations_update ON video_annotations FOR UPDATE USING (
  is_super_admin() OR tenant_id = auth.uid()
) WITH CHECK (
  is_super_admin() OR tenant_id = auth.uid()
);

-- Add super admin bypass to DELETE policies
DROP POLICY IF EXISTS recordings_delete ON recordings;
CREATE POLICY recordings_delete ON recordings FOR DELETE USING (
  is_super_admin() OR tenant_id = auth.uid()
);

DROP POLICY IF EXISTS screen_recordings_delete ON screen_recordings;
CREATE POLICY screen_recordings_delete ON screen_recordings FOR DELETE USING (
  is_super_admin() OR tenant_id = auth.uid()
);
