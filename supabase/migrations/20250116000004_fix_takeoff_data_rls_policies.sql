-- Enable RLS on takeoff_data if not already enabled
ALTER TABLE public.takeoff_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "insert_takeoff_by_user" ON public.takeoff_data;
DROP POLICY IF EXISTS "insert_takeoff_for_own_plans" ON public.takeoff_data;
DROP POLICY IF EXISTS "select_takeoff_for_own_plans" ON public.takeoff_data;
DROP POLICY IF EXISTS "update_takeoff_for_own_plans" ON public.takeoff_data;
DROP POLICY IF EXISTS "delete_takeoff_for_own_plans" ON public.takeoff_data;

-- Grant necessary permissions to authenticated users
GRANT INSERT, SELECT, UPDATE, DELETE ON public.takeoff_data TO authenticated;

-- Policy for INSERT: User can insert takeoff data for their own plans
CREATE POLICY "insert_takeoff_for_own_plans"
ON public.takeoff_data
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = plan_id AND p.user_id = (SELECT auth.uid())
  )
);

-- Policy for SELECT: User can view takeoff data for their own plans
CREATE POLICY "select_takeoff_for_own_plans"
ON public.takeoff_data
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = plan_id AND p.user_id = (SELECT auth.uid())
  )
);

-- Policy for UPDATE: User can update takeoff data for their own plans
CREATE POLICY "update_takeoff_for_own_plans"
ON public.takeoff_data
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = plan_id AND p.user_id = (SELECT auth.uid())
  )
);

-- Policy for DELETE: User can delete takeoff data for their own plans
CREATE POLICY "delete_takeoff_for_own_plans"
ON public.takeoff_data
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = plan_id AND p.user_id = (SELECT auth.uid())
  )
);

-- Ensure plans table has proper SELECT policy for the subquery
-- (Only add if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'plans' 
    AND policyname = 'select_own_plans'
  ) THEN
    CREATE POLICY "select_own_plans"
    ON public.plans
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;
