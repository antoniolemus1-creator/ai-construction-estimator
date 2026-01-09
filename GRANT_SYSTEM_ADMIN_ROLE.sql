-- Grant System Admin Role (can access /admin route with delegated permissions)
-- This is different from organization admin

-- Replace 'admin-email@example.com' with the actual email
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin-email@example.com';

-- Verify the update
SELECT id, email, role, user_type, organization_id 
FROM user_profiles 
WHERE email = 'admin-email@example.com';

-- Note: This grants SYSTEM ADMIN role, not organization admin
-- System admins can access /admin route but have limited permissions compared to super_admin
-- Organization admins are managed through organization_members table and cannot access /admin
