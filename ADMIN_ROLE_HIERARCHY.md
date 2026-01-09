# Admin Role Hierarchy - Complete Guide

## Role Structure

### 1. **super_admin** (Platform Owner)
- **Access**: Full platform access
- **Permissions**: 
  - Access `/admin` route
  - Manage all users, organizations, and system settings
  - Create/modify system admins
  - Full database access
  - Billing and subscription management
  - System configuration
- **Location**: `user_profiles.role = 'super_admin'`
- **Scope**: Platform-wide (no organization restriction)

### 2. **admin** (System Admin)
- **Access**: Delegated platform administration
- **Permissions**:
  - Access `/admin` route
  - Manage users within assigned scope
  - View system logs and analytics
  - Limited configuration access (as delegated by super_admin)
  - Cannot modify super_admin accounts
  - Cannot change system-critical settings
- **Location**: `user_profiles.role = 'admin'`
- **Scope**: Platform-wide (no organization restriction)

### 3. **Organization Admin**
- **Access**: Organization-scoped only
- **Permissions**:
  - NO access to `/admin` route
  - Manage users within their organization
  - Organization settings and billing
  - Project and data management for their org
  - Invite/remove organization members
- **Location**: `organization_members.role = 'admin'`
- **Scope**: Single organization only

## SQL to Grant Roles

### Make User a super_admin
```sql
UPDATE user_profiles 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';
```

### Make User a System Admin
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin-email@example.com';
```

### Make User an Organization Admin
```sql
-- First ensure they're a member
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('org-uuid', 'user-uuid', 'admin')
ON CONFLICT (organization_id, user_id) 
DO UPDATE SET role = 'admin';
```

## Route Protection

The `/admin` route checks:
```typescript
const isSystemAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
```

Organization admins are checked separately in organization-scoped features.

## Key Distinctions

| Feature | super_admin | admin (System) | admin (Org) |
|---------|-------------|----------------|-------------|
| `/admin` route | ✅ Yes | ✅ Yes | ❌ No |
| Platform-wide access | ✅ Yes | ⚠️ Limited | ❌ No |
| Manage all orgs | ✅ Yes | ❌ No | ❌ No |
| Manage own org | ✅ Yes | ✅ Yes | ✅ Yes |
| System settings | ✅ Yes | ⚠️ Limited | ❌ No |
| Create system admins | ✅ Yes | ❌ No | ❌ No |

## Implementation Notes

- System-level roles stored in `user_profiles.role`
- Organization-level roles stored in `organization_members.role`
- Both can have role='admin' but different scope and permissions
- Route guards check system-level roles only
- Organization features check organization_members table
