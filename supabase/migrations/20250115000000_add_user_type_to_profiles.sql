-- Add user_type column to user_profiles table
-- This allows distinguishing between clients and employees

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'employee'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);

-- Update existing users to have default 'client' type if null
UPDATE public.user_profiles 
SET user_type = 'client' 
WHERE user_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.user_type IS 'Type of user: client (external customer) or employee (internal staff)';
