# License Key System Setup Guide

## Overview
This application now includes a comprehensive license key system that prevents unauthorized deployment and usage.

## Features
- ✅ Server-side license validation
- ✅ Domain locking (restrict to specific domains)
- ✅ Hardware fingerprinting (prevent unauthorized copying)
- ✅ Activation limits (control number of installations)
- ✅ Expiration dates
- ✅ Real-time validation on startup

## Setup Instructions

### 1. Create a License Key

Run this SQL in your Supabase SQL Editor:

```sql
INSERT INTO license_keys (
  license_key,
  organization_name,
  allowed_domains,
  max_activations,
  expires_at
) VALUES (
  'YOUR-UNIQUE-LICENSE-KEY-HERE',
  'Organization Name',
  ARRAY['yourdomain.com', 'localhost'],
  3,
  '2026-12-31 23:59:59'
);
```

### 2. Configure Environment Variable

Add to your `.env` file:
```
VITE_LICENSE_KEY=YOUR-UNIQUE-LICENSE-KEY-HERE
```

### 3. Deploy Configuration

When deploying, set the environment variable in your hosting platform:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Other**: Add `VITE_LICENSE_KEY` to your deployment config

## Managing Licenses

### View All Licenses
```sql
SELECT * FROM license_keys;
```

### Deactivate a License
```sql
UPDATE license_keys 
SET is_active = false 
WHERE license_key = 'KEY-TO-DEACTIVATE';
```

### Add More Domains
```sql
UPDATE license_keys 
SET allowed_domains = ARRAY['domain1.com', 'domain2.com', 'localhost']
WHERE license_key = 'YOUR-KEY';
```

### Reset Activations
```sql
UPDATE license_keys 
SET hardware_fingerprints = '{}', 
    current_activations = 0 
WHERE license_key = 'YOUR-KEY';
```

### Extend Expiration
```sql
UPDATE license_keys 
SET expires_at = '2027-12-31 23:59:59' 
WHERE license_key = 'YOUR-KEY';
```

## Security Features

1. **Domain Locking**: App only runs on approved domains
2. **Hardware Fingerprinting**: Tracks unique browser/device combinations
3. **Activation Limits**: Prevents unlimited installations
4. **Server Validation**: Keys validated server-side (cannot be bypassed)
5. **Expiration**: Time-limited licenses

## For Developers You Share With

Developers will see a prominent error screen if:
- No license key is configured
- License key is invalid
- Domain is not authorized
- Maximum activations reached
- License has expired

They must contact you to obtain a valid license key.

## Generating Secure License Keys

Use this format for strong license keys:
```
APPNAME-XXXX-XXXX-XXXX-XXXX
```

Generate random keys using:
```bash
openssl rand -hex 16
```

Then format as: `CONSTRUCTAI-XXXX-XXXX-XXXX-XXXX`
