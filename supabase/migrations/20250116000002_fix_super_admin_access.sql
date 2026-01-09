-- Ensure the user_type constraint includes super_admin
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check 
  CHECK (user_type IN ('client', 'employee', 'super_admin'));

-- Grant super_admin access to the specified user
UPDATE user_profiles 
SET user_type = 'super_admin'
WHERE email = 'a@hgbgiyguh.bihi';

-- If the profile doesn't exist, create it
INSERT INTO user_profiles (id, email, user_type, subscription_tier)
SELECT 
  au.id,
  au.email,
  'super_admin',
  'enterprise'
FROM auth.users au
WHERE au.email = 'a@hgbgiyguh.bihi'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.email = 'a@hgbgiyguh.bihi'
);

-- Verify the update
SELECT id, email, user_type, role, subscription_tier 
FROM user_profiles 
WHERE email = 'a@hgbgiyguh.bihi';
