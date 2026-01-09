# Organization-Level Multi-Tenancy Implementation Guide

## Overview
This system implements organization-level multi-tenancy, allowing multiple users within the same organization to share data while maintaining complete isolation from other organizations.

## Database Schema

### Tables Created
1. **organizations** - Stores company/organization details
2. **organization_members** - Junction table for user-organization relationships with roles
3. **organization_invitations** - Manages team member invitations

### Columns Added to Existing Tables
- `organization_id` added to: user_profiles, plans, takeoff_data, specifications

## Features Implemented

### 1. Organization Management
- Create organizations with name, description, industry, size
- Update organization settings
- Soft delete organizations
- Organization owner automatically assigned on creation

### 2. Team Management
- Invite team members via email
- Role-based access: owner, admin, manager, member, viewer
- Remove team members
- View all organization members

### 3. Data Sharing
- Users in same organization can view/edit shared data
- RLS policies enforce organization-level isolation
- Individual user data still accessible (tenant_id)

### 4. Security (RLS Policies)
All tables have organization-aware RLS policies:
- Read: Users can access their own data OR organization data
- Create: Members can create data for their organization
- Update: Members can update organization data
- Delete: Only admins/managers can delete organization data

## Usage

### Access Organization Management
Navigate to `/organization` to:
- Create a new organization
- Update organization settings
- Manage team members
- Send invitations

### API - Create Organization
```typescript
const { data } = await supabase.functions.invoke('manage-organization', {
  body: {
    action: 'create',
    organizationData: {
      name: 'Acme Construction',
      description: 'General contractor',
      industry: 'Construction',
      size: '11-50'
    }
  }
});
```

### API - Update Organization
```typescript
const { data } = await supabase.functions.invoke('manage-organization', {
  body: {
    action: 'update',
    organizationId: 'uuid',
    organizationData: { name: 'New Name' }
  }
});
```

## Role Permissions
- **Owner**: Full control, can delete organization
- **Admin**: Manage members, update settings
- **Manager**: Edit data, manage projects
- **Member**: Create and edit data
- **Viewer**: Read-only access

## Next Steps
1. Add organization logo upload
2. Implement organization-wide settings
3. Add usage analytics per organization
4. Create organization billing/subscriptions
5. Add audit logs for organization actions
