# Admin Dashboard Location & Features

## Admin Dashboard Location

**Route**: `/admin`  
**Component**: `AdminDashboard` (located at `src/components/AdminDashboard.tsx`)  
**Guard**: `AdminRoute` (checks for `super_admin` OR `admin` role)

## Features Available in Admin Dashboard

The Admin Dashboard (`/admin` route) contains the following management controls:

### 1. **Users Tab**
- `ComprehensiveUserCreator` - Create new users with roles
- `AdminUsers` - View and manage all users
- `OrganizationCreator` - Create organizations (super_admin only)

### 2. **Roles & Permissions Tab**
- `RolesManager` - Manage system roles
- `UserRoleAssignment` - Assign roles to users

### 3. **License Keys Tab**
- `ComprehensiveLicenseManager` - Full license key management
  - Create license keys
  - Assign licenses to users
  - View license activation requests
  - Manage license domains

### 4. **Subscriptions Tab**
- `AdminSubscriptions` - Manage user subscriptions

### 5. **Billing Tab**
- `BillingHistory` - View billing history

### 6. **Tickets Tab**
- `AdminTickets` - Manage support tickets

### 7. **Announcements Tab**
- `AdminAnnouncements` - Create system announcements

### 8. **API Usage Tab**
- `BillingSettingsManager` - Configure billing settings
- `ApiUsageDashboard` - Monitor API usage

### 9. **System Logs Tab**
- `SystemLogsViewer` - View system logs

## Access Control

### Who Can Access `/admin` Route:
1. **super_admin** - Full platform access (can do everything)
2. **admin** - System admin with delegated permissions (can access /admin route)

### Who CANNOT Access `/admin` Route:
- **Organization admins** - These are users with admin role within an organization (in `organization_members` table), but they do NOT have access to the `/admin` route
- Regular users

## How to Access

1. **Set the correct role in database**:
   ```sql
   UPDATE user_profiles 
   SET role = 'super_admin'  -- or 'admin' for system admin
   WHERE email = 'your-email@example.com';
   ```

2. **Navigate to the route**:
   - Direct URL: `http://your-domain.com/admin`
   - Or click the "Admin Dashboard" button in the navigation (only visible to super_admin and admin users)

## Troubleshooting

If you cannot see the Admin Dashboard:

1. **Check your role in database**:
   ```sql
   SELECT email, role FROM user_profiles WHERE email = 'your-email@example.com';
   ```

2. **Verify the role is either `super_admin` or `admin`** (not organization admin)

3. **Clear browser cache and refresh**

4. **Check browser console** for any error messages

## Role Hierarchy Summary

```
super_admin (highest)
    ├── Full platform access
    ├── Can access /admin route
    ├── Can create organizations
    └── Can do everything

admin (system admin)
    ├── Delegated permissions
    ├── Can access /admin route
    └── Cannot create organizations

organization admin (lowest)
    ├── Scoped to specific organization
    ├── CANNOT access /admin route
    └── Manages only their organization
```
