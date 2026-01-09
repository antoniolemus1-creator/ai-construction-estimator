# Fix Admin Access for a@hgbgiyguh.bihi

## Quick Fix - Run this SQL in Supabase SQL Editor:

```sql
-- Update user_type constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check 
  CHECK (user_type IN ('client', 'employee', 'super_admin'));

-- Set super_admin for your account
UPDATE user_profiles 
SET user_type = 'super_admin'
WHERE email = 'a@hgbgiyguh.bihi';

-- Verify it worked
SELECT id, email, user_type, role FROM user_profiles WHERE email = 'a@hgbgiyguh.bihi';
```

## What was fixed:

1. **AdminRoute.tsx** - Now checks `user_type = 'super_admin'` with debug logging
2. **Database migration** - Sets user_type='super_admin' for your account
3. **Console logging** - Check browser console for "AdminRoute:" messages to debug

## After running the SQL:

1. Sign out and sign back in
2. Navigate to `/admin` 
3. Check browser console for debug messages
4. You should see the Admin Portal with tabs for Users, Roles, Licenses, etc.

## If still not working:

Check browser console for these messages:
- "AdminRoute: Checking admin status for user: a@hgbgiyguh.bihi"
- "AdminRoute: Profile data: {user_type: 'super_admin', ...}"
- "AdminRoute: Is super admin? true"
