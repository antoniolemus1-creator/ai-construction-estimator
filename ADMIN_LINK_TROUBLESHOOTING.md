# Admin Link Troubleshooting Guide

## Problem
The Admin Dashboard link is not appearing in the navigation bar.

## Why This Happens
The admin link in the navigation bar (AppLayout.tsx lines 271-281) only shows when:
1. You are logged in as a user
2. Your database record has `user_type = 'super_admin'`

## Quick Check - Open Browser Console (F12)
Look for these console messages when you log in:
```
🔍 AppLayout: Checking admin status for user: a@hgbgiyguh.bihi
👤 AppLayout: Profile data: {user_type: "...", email: "..."}
✅ AppLayout: Is super admin? true/false
```

If you see `Is super admin? false`, your database needs to be updated.

## Solution: Run SQL Script

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL
```sql
-- Update your user to super_admin
UPDATE user_profiles 
SET user_type = 'super_admin'
WHERE email = 'a@hgbgiyguh.bihi';

-- Verify the update
SELECT id, email, user_type, role 
FROM user_profiles 
WHERE email = 'a@hgbgiyguh.bihi';
```

### Step 3: Refresh & Check
1. Log out of the application
2. Log back in
3. Check browser console for the admin status messages
4. The "Admin Dashboard" button should now appear in the top navigation bar

## Where to Find the Admin Link

### Primary Location (Conditional)
**Top Navigation Bar** - Shows only for super_admins
- Look for a cyan button with Shield icon
- Text: "Admin Dashboard"
- Located in the top right area, before your email

### Backup Location (Always Visible)
**Footer** - Always visible to everyone
- Scroll to bottom of page
- Under "Company" section
- Link text: "Employees"
- This link goes to `/admin` but will show access denied if you're not super_admin

## Testing Access

After running the SQL:
1. Navigate to: `http://localhost:5173/admin` (or your domain + /admin)
2. You should see the Admin Portal with tabs for:
   - Users
   - Roles
   - Licenses
   - Subscriptions
   - Billing
   - Tickets
   - Announcements
   - API Usage
   - System Logs

## Still Not Working?

Check these in browser console:
- ❌ If you see "No user found" → You're not logged in
- ❌ If you see "Is super admin? false" → Database not updated
- ⚠️ If you see an error → Check the error message

Run this SQL to check your current status:
```sql
SELECT 
  id, 
  email, 
  user_type, 
  role, 
  subscription_tier,
  created_at
FROM user_profiles 
WHERE email = 'a@hgbgiyguh.bihi';
```

Expected result:
- user_type: `super_admin`
- role: `super_admin` (optional but recommended)
- subscription_tier: `enterprise` (optional but recommended)
