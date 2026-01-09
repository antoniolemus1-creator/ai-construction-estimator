-- Create a verified license activation for testing
-- Replace 'your-email@example.com' with your actual email address

-- First, check if activation already exists
DELETE FROM license_activation_requests 
WHERE email = 'your-email@example.com';

-- Create a verified activation
INSERT INTO license_activation_requests (
  license_key,
  domain,
  email,
  verification_token,
  verified,
  verified_at,
  expires_at
) VALUES (
  'LIC-TEST-DEV1-2024-DEMO',
  'localhost',
  'your-email@example.com',  -- CHANGE THIS TO YOUR EMAIL
  'test-token-' || gen_random_uuid(),
  true,  -- Already verified
  NOW(),
  NOW() + INTERVAL '1 year'
);

-- Verify it was created
SELECT 
  email,
  license_key,
  verified,
  verified_at,
  expires_at
FROM license_activation_requests
WHERE email = 'your-email@example.com';
