-- Add super_admin to user_type check constraint
-- Drop the old constraint and create a new one that includes super_admin

ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;

ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_user_type_check 
CHECK (user_type IN ('client', 'employee', 'super_admin'));

-- Update the specific user to super_admin
UPDATE public.user_profiles 
SET user_type = 'super_admin',
    subscription_tier = 'enterprise',
    subscription_status = 'active'
WHERE email = 'a@hgbgiyguh.bihi';

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.user_type IS 'Type of user: client (external customer), employee (internal staff), or super_admin (system administrator)';
