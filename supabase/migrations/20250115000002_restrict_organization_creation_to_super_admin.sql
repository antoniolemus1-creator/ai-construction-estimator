-- Restrict organization creation to super_admins only
-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "organizations_insert_policy" ON organizations;

-- Create new INSERT policy that only allows super_admins to create organizations
CREATE POLICY "organizations_insert_policy" ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Update the UPDATE policy to also restrict to super_admins
DROP POLICY IF EXISTS "organizations_update_policy" ON organizations;

CREATE POLICY "organizations_update_policy" ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );

-- Update the DELETE policy to also restrict to super_admins
DROP POLICY IF EXISTS "organizations_delete_policy" ON organizations;

CREATE POLICY "organizations_delete_policy" ON organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.user_type = 'super_admin'
    )
  );
