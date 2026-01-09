-- Auto-confirm email addresses for test users and users created by super admins
-- This eliminates the need for manual email confirmation in testing environments

-- Create function to auto-confirm emails
CREATE OR REPLACE FUNCTION auto_confirm_test_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm if email ends with @testconstruction.com
  IF NEW.email LIKE '%@testconstruction.com' THEN
    NEW.email_confirmed_at := NOW();
    RETURN NEW;
  END IF;

  -- Auto-confirm if created by a super admin
  -- Check if the current user (creator) is a super admin
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND user_type = 'super_admin'
  ) THEN
    NEW.email_confirmed_at := NOW();
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS auto_confirm_test_emails_trigger ON auth.users;
CREATE TRIGGER auto_confirm_test_emails_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_test_emails();

-- Also update existing @testconstruction.com users
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE 
  email LIKE '%@testconstruction.com'
  AND email_confirmed_at IS NULL;
