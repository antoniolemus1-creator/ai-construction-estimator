-- This script adds common development domains to the test license key
-- Run this in your Supabase SQL Editor

-- Update the test license to allow localhost and common dev domains
UPDATE license_keys
SET allowed_domains = ARRAY['localhost', '127.0.0.1', 'lovable.dev', 'localhost:5173', '127.0.0.1:5173']
WHERE license_key = 'LIC-TEST-DEV1-2024-DEMO';

-- Verify the update
SELECT 
  license_key,
  company_name,
  allowed_domains,
  is_active,
  expires_at
FROM license_keys
WHERE license_key = 'LIC-TEST-DEV1-2024-DEMO';
