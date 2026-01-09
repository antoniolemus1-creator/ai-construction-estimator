-- Fix RLS policies for organizations table to allow admin creation
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "organizations_select_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view organizations they're members of, admins can view all
CREATE POLICY "organizations_select_policy" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- INSERT: Only admins and super_admins can create organizations
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- UPDATE: Organization owners/admins or system admins can update
CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- DELETE: Only super_admins can delete organizations
CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );
