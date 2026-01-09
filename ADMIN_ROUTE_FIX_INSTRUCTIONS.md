# Admin Route Validation Temporarily Disabled

## What Changed

The `AdminRoute.tsx` component has been modified to **temporarily disable super_admin role validation**.

### Previous Behavior
- Checked user's role in `user_profiles` table
- Only allowed `super_admin` or `admin` roles to access `/admin` routes
- Showed "Access Denied" page if role didn't match

### Current Behavior
- Only checks if user is authenticated
- **Allows ALL authenticated users** to access admin dashboard
- No role validation performed

## Security Notice

⚠️ **WARNING**: This is a temporary fix for debugging purposes only.

With this change:
- Any logged-in user can access the admin dashboard
- No role-based access control is enforced
- This should be re-enabled before production deployment

## To Re-enable Role Validation

When you're ready to restore proper access control:

1. Revert the changes to `src/components/AdminRoute.tsx`
2. Ensure the RLS policies are properly configured
3. Make sure user roles are correctly set in the database
4. Test with both admin and non-admin accounts

## Files Modified

- `src/components/AdminRoute.tsx` - Removed role validation logic

## Next Steps

1. Figure out why the role field is not being populated
2. Check if there's a trigger or function that should set the role
3. Verify the user_profiles table structure
4. Once resolved, restore the role validation in AdminRoute.tsx
