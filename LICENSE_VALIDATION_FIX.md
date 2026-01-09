# License Validation Fix

## Problem
The LicenseGuard component was trying to query `license_keys.email` which doesn't exist. The license system is organization-based, not user-based.

## Solution
Updated LicenseGuard to properly check `license_activation_requests` table with a join to `license_keys`.

## How License System Works

1. **License Keys** are organization-based with:
   - `license_key`: The actual key
   - `organization_name`: Company name
   - `allowed_domains`: Array of domains that can use this license
   - `is_active`: Whether license is active
   - `expires_at`: Expiration date

2. **Activation Flow**:
   - User enters license key and email on `/activate-license`
   - System creates record in `license_activation_requests`
   - User receives verification email
   - User clicks verification link
   - Activation is marked as `verified=true`

3. **License Check**:
   - LicenseGuard checks if user's email has a verified activation
   - Joins with license_keys to ensure license is still active
   - Redirects to activation page if no valid license found

## For Testing

Run the SQL script in `CREATE_TEST_LICENSE_ACTIVATION.sql` to create a verified activation:

```sql
-- Replace with your actual email
UPDATE license_activation_requests 
SET verified = true, verified_at = NOW()
WHERE email = 'your-email@example.com';
```

Or create a new one:
```bash
psql -f CREATE_TEST_LICENSE_ACTIVATION.sql
```

## Test License Key
```
LIC-TEST-DEV1-2024-DEMO
```

This key allows:
- localhost, 127.0.0.1
- *.netlify.app, *.vercel.app
- *.supabase.co
- Max 10 activations
- Expires: 2026-10-13
