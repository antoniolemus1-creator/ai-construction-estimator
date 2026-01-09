-- WORKING SQL FOR LICENSE SETUP
-- This file contains the corrected SQL statements that work with the actual schema

-- ============================================
-- STEP 1: Insert License Activation Request
-- ============================================
-- NOTE: verification_token is REQUIRED (NOT NULL constraint)

INSERT INTO license_activation_requests (
  license_key, 
  domain, 
  email,
  verification_token,  -- REQUIRED FIELD!
  verified, 
  verified_at, 
  expires_at
) VALUES (
  'LIC-TEST-DEV1-2024-DEMO4216b5ea',
  'construction-ai-estimator.deploypad.app',
  'admin@yourclient.com',
  'VERIFIED-' || substr(md5(random()::text), 1, 16),  -- Generate random token
  true,
  NOW(),
  NOW() + INTERVAL '1 year'
);

-- ============================================
-- STEP 2: Create New License Key (if needed)
-- ============================================
-- Only run this if the license key doesn't exist yet

INSERT INTO license_keys (
  license_key, 
  organization_name, 
  allowed_domains, 
  max_activations,
  current_activations,
  is_active,
  expires_at
) VALUES (
  'LIC-CLIENT-2024-PROD-' || substr(md5(random()::text), 1, 8),
  'Client Company Name',
  ARRAY['yourclient.com', 'www.yourclient.com', 'localhost'],
  5,
  0,
  true,
  NOW() + INTERVAL '1 year'
);

-- ============================================
-- STEP 3: Add Domain to Existing License
-- ============================================
-- Use this to add a new domain to an existing license

UPDATE license_keys
SET allowed_domains = array_append(allowed_domains, 'new-domain.com')
WHERE license_key = 'YOUR-LICENSE-KEY'
  AND NOT ('new-domain.com' = ANY(allowed_domains));

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Check that everything is set up correctly

SELECT 
  lk.license_key,
  lk.organization_name,
  lk.allowed_domains,
  lk.is_active,
  lk.expires_at,
  lar.domain,
  lar.email,
  lar.verified,
  lar.verified_at
FROM license_keys lk
LEFT JOIN license_activation_requests lar ON lk.license_key = lar.license_key
WHERE lk.license_key = 'YOUR-LICENSE-KEY';
