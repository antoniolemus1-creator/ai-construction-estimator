-- =====================================================
-- FIX SUPER ADMIN ROLE - Set role for existing super_user
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Step 1: Check current user_profiles structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Step 2: Check if 'role' column exists, if not add it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role TEXT;
  END IF;
END $$;

-- Step 3: Update ALL super_admin user_type accounts to have super_admin role
UPDATE user_profiles 
SET role = 'super_admin'
WHERE user_type = 'super_admin' AND (role IS NULL OR role != 'super_admin');

-- Step 4: Update ALL admin user_type accounts to have admin role
UPDATE user_profiles 
SET role = 'admin'
WHERE user_type = 'admin' AND (role IS NULL OR role != 'admin');

-- Step 5: Verify all super_admin accounts now have role set
SELECT id, email, user_type, role, subscription_tier, created_at
FROM user_profiles 
WHERE user_type IN ('super_admin', 'admin')
ORDER BY created_at;

-- Step 6: Show any accounts with user_type but no role (should be empty)
SELECT id, email, user_type, role
FROM user_profiles 
WHERE user_type IS NOT NULL AND role IS NULL;

-- =====================================================
-- IMPORTANT: After running this, LOG OUT and LOG BACK IN
-- to refresh your authentication session!
-- =====================================================
