-- ============================================
-- SUPER ADMIN ONLY ACCESS TO /admin ROUTE
-- ============================================
-- This grants access to the /admin route ONLY for super_admin users
-- Regular 'admin' role is for organization-level admins (NOT /admin access)
-- ============================================

-- Replace 'your-email@example.com' with your actual email address
UPDATE user_profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';

-- Verify the change
SELECT id, email, role, created_at 
FROM user_profiles 
WHERE email = 'your-email@example.com';

-- ============================================
-- ROLE DISTINCTIONS:
-- ============================================
-- 1. super_admin: Platform-wide admin, can access /admin route
-- 2. admin: Organization-level admin, CANNOT access /admin route
-- 3. user: Regular user with no admin privileges
-- ============================================

-- To check all super_admins:
SELECT id, email, role, created_at 
FROM user_profiles 
WHERE role = 'super_admin'
ORDER BY created_at DESC;

-- To check all organization admins:
SELECT id, email, role, created_at 
FROM user_profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;
