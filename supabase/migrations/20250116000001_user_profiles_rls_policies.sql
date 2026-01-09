-- Add RLS policies for user_profiles table
-- Allow users to read their own profile
-- Allow super_admins to read all profiles

-- Enable RLS on user_profiles if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_insert ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;

-- Allow users to read their own profile
CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.user_type = 'super_admin'
    )
  );

-- Allow users to update their own profile
CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY user_profiles_insert ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
