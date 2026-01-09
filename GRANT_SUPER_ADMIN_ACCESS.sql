-- =====================================================
-- GRANT SUPER ADMIN ACCESS
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Step 1: Add super_admin to user_type constraint if not exists
DO $$ 
BEGIN
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check 
    CHECK (user_type IN ('client', 'employee', 'super_admin'));
END $$;

-- Step 2: Grant super_admin access to a@hgbgiyguh.bihi
UPDATE user_profiles 
SET 
  user_type = 'super_admin',
  subscription_tier = 'enterprise',
  role = 'super_admin'
WHERE email = 'a@hgbgiyguh.bihi';

-- Step 3: Verify the update
SELECT id, email, user_type, role, subscription_tier 
FROM user_profiles 
WHERE email = 'a@hgbgiyguh.bihi';

-- Step 4: Enable RLS if not enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policy for super_admin to read all profiles
DROP POLICY IF EXISTS "Super admins can read all profiles" ON user_profiles;
CREATE POLICY "Super admins can read all profiles" ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.user_type = 'super_admin'
    )
  );

-- Step 6: Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Done! Now log out and log back in to refresh your session.
