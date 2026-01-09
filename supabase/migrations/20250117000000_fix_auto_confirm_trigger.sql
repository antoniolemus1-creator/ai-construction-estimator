-- Fix the auto_confirm_test_emails trigger
-- The trigger was referencing 'user_id' but user_profiles uses 'id' column
-- Also make the trigger more robust for signup scenarios

-- Drop and recreate the function with the correct column reference
CREATE OR REPLACE FUNCTION auto_confirm_test_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm if email ends with @testconstruction.com
  IF NEW.email LIKE '%@testconstruction.com' THEN
    NEW.email_confirmed_at := NOW();
    RETURN NEW;
  END IF;

  -- Auto-confirm if email ends with @example.com (for testing)
  IF NEW.email LIKE '%@example.com' THEN
    NEW.email_confirmed_at := NOW();
    RETURN NEW;
  END IF;

  -- Auto-confirm if created by a super admin
  -- Note: auth.uid() might be NULL during signup, so we check safely
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS auto_confirm_test_emails_trigger ON auth.users;
CREATE TRIGGER auto_confirm_test_emails_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_test_emails();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.user_profiles TO postgres, anon, authenticated, service_role;
