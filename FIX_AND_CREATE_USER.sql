-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- Step 1: Drop problematic trigger
DROP TRIGGER IF EXISTS auto_confirm_test_emails_trigger ON auth.users;

-- Step 2: Fix the function (correct column reference: id instead of user_id)
CREATE OR REPLACE FUNCTION auto_confirm_test_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm test domains
  IF NEW.email LIKE '%@testconstruction.com' OR NEW.email LIKE '%@example.com' THEN
    NEW.email_confirmed_at := NOW();
    RETURN NEW;
  END IF;

  -- Auto-confirm if created by a super admin (only if uid is set)
  IF auth.uid() IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND user_type = 'super_admin'
    ) THEN
      NEW.email_confirmed_at := NOW();
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If any error occurs, just proceed with normal signup
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate trigger
CREATE TRIGGER auto_confirm_test_emails_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_test_emails();

-- Step 4: Verify trigger was created
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_schema = 'auth';
