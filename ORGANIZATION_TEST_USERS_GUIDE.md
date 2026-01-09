# Organization Test Users Setup Guide

## Test Credentials Created

Since we cannot directly create auth.users via SQL, you need to **sign up** these users through the application UI:

### Test Organization: Test Construction Company
- **Organization ID**: `00000000-0000-0000-0000-000000000001`
- **Slug**: `test-construction-co`

### Test User Credentials

#### 1. Organization Owner
- **Email**: `owner@testconstruction.com`
- **Password**: `TestPass123!`
- **Name**: John Owner
- **Organization Role**: `owner`
- **System Role**: `user`

#### 2. Organization Admin
- **Email**: `admin@testconstruction.com`
- **Password**: `TestPass123!`
- **Name**: Jane Admin
- **Organization Role**: `admin`
- **System Role**: `user`

#### 3. Organization Member
- **Email**: `member@testconstruction.com`
- **Password**: `TestPass123!`
- **Name**: Bob Member
- **Organization Role**: `member`
- **System Role**: `user`

## Setup Instructions

### Option 1: Manual Signup (Recommended)
1. Sign up each user through the application
2. After signup, run the SQL script below to assign them to the test organization

### Option 2: Use Edge Function
Create users via Supabase Admin API (requires service role key)

## SQL to Assign Users to Organization

After users sign up, run this to assign organization roles:

```sql
-- Get the actual user IDs after signup
SELECT id, email FROM auth.users 
WHERE email IN (
  'owner@testconstruction.com',
  'admin@testconstruction.com', 
  'member@testconstruction.com'
);

-- Then update with actual IDs:
UPDATE user_profiles 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE email IN (
  'owner@testconstruction.com',
  'admin@testconstruction.com',
  'member@testconstruction.com'
);

-- Assign organization roles (replace UUIDs with actual user IDs)
INSERT INTO organization_members (organization_id, user_id, role, joined_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '<owner-uuid>', 'owner', NOW()),
  ('00000000-0000-0000-0000-000000000001', '<admin-uuid>', 'admin', NOW()),
  ('00000000-0000-0000-0000-000000000001', '<member-uuid>', 'member', NOW())
ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role;
```

## Organization Role Permissions

### Owner
- Full control over organization
- Can delete organization
- Can manage all members
- Can change organization settings
- Access to all organization data

### Admin
- Can invite/remove members (except owner)
- Can manage organization data
- Cannot delete organization
- Cannot remove owner

### Member
- Can view organization data
- Can create/edit their own content
- Cannot manage other members
- Limited administrative access

## Testing Access

1. Login as each user
2. Navigate to `/organization` page
3. Verify role-based permissions
4. Test member management (owner/admin only)
5. Test data access based on organization_id

## Database Schema Reference

```
organizations
  - id (uuid)
  - name
  - slug
  
organization_members
  - organization_id (uuid)
  - user_id (uuid)
  - role (owner|admin|member)
  
user_profiles
  - id (uuid)
  - organization_id (uuid)
  - role (system role: super_admin|admin|user)
```
