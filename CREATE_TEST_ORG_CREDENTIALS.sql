-- CREATE TEST ORGANIZATION CREDENTIALS
-- This script creates a test organization and assigns users with different roles

-- Step 1: Create test organization (if not exists)
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Construction Company',
  'test-construction',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Confirm email addresses for test users (IMPORTANT - prevents "email not confirmed" error)
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email IN (
  'owner@testconstruction.com',
  'admin@testconstruction.com',
  'member@testconstruction.com'
);

-- Step 3: Assign organization roles to users
INSERT INTO user_profiles (organization_id, user_id, role, created_at)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid as organization_id,
  u.id as user_id,
  CASE 
    WHEN u.email = 'owner@testconstruction.com' THEN 'owner'
    WHEN u.email = 'admin@testconstruction.com' THEN 'admin'
    WHEN u.email = 'member@testconstruction.com' THEN 'member'
  END as role,
  NOW() as created_at
FROM auth.users u
WHERE u.email IN (
  'owner@testconstruction.com',
  'admin@testconstruction.com',
  'member@testconstruction.com'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  organization_id = EXCLUDED.organization_id,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 4: Verify the assignments
SELECT 
  u.email,
  up.role,
  o.name as organization_name,
  u.email_confirmed_at,
  u.confirmed_at
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
JOIN organizations o ON up.organization_id = o.id
WHERE u.email IN (
  'owner@testconstruction.com',
  'admin@testconstruction.com',
  'member@testconstruction.com'
);
