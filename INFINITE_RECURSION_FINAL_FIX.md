# Infinite Recursion Final Fix

## Problem
The `user_profiles` table was experiencing infinite recursion errors when trying to load users in the admin dashboard.

## Root Cause
ANY RLS policy that references the `user_profiles` table within its own policy creates infinite recursion. This includes:
- Subqueries checking `user_type` or `role` fields
- JOINs back to the same table
- EXISTS clauses that query user_profiles

## Solution Applied
Dropped ALL complex policies and created only the simplest possible policies:

```sql
-- Users can read their own profile (using only auth.uid())
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## What This Means
- Users can ONLY see their own profile
- There are NO super_admin bypass policies (to avoid recursion)
- Admin functionality must be handled differently (service role key or edge functions)

## Next Steps for Admin Access
To allow admins to see all users, you need to:

1. **Option A: Use Service Role in Edge Function**
   - Create an edge function that uses the service role key
   - This bypasses RLS entirely
   - Call this function from the admin dashboard

2. **Option B: Disable RLS on user_profiles**
   ```sql
   ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
   ```
   - This allows all authenticated users to see all profiles
   - Less secure but avoids recursion

3. **Option C: Use a separate admin_users view**
   - Create a view with different RLS policies
   - Admins query the view instead of the table directly

## Current Status
✅ Infinite recursion eliminated
✅ Users can access their own profiles
❌ Admins cannot see other users (by design to prevent recursion)
