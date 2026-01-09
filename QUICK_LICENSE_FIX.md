# Quick Fix for "Domain Not Authorized" Error

You're seeing this error because your current domain (likely `localhost` or `127.0.0.1`) is not in the allowed domains list for the test license key.

## Option 1: Run SQL Script (Fastest)

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the contents of `ADD_DOMAINS_TO_LICENSE.sql`
4. Click "Run" to execute the script
5. Refresh your application

This will add these domains to your license:
- localhost
- 127.0.0.1
- lovable.dev
- localhost:5173
- 127.0.0.1:5173

## Option 2: Use Admin Interface

1. Make sure you're logged in as an admin user
2. Navigate to `/admin` in your application
3. Click on the "Licenses" tab
4. Find the license with key `LIC-TEST-DEV1-2024-DEMO`
5. Click the shield icon to view details
6. Click edit and add your domain to the "Allowed Domains" field
7. Save changes

## Option 3: Manual SQL Update

If you need to add a specific domain, run this in Supabase SQL Editor:

```sql
UPDATE license_keys
SET allowed_domains = array_append(allowed_domains, 'your-domain-here.com')
WHERE license_key = 'LIC-TEST-DEV1-2024-DEMO';
```

Replace `your-domain-here.com` with your actual domain.

## Current Domain Detection

Your application is running on: **check `window.location.hostname` in browser console**

Make sure this domain is in the allowed_domains list!
