# Test License Key Created

A test license key has been created for development and testing purposes.

## License Key Details

**License Key:** `LIC-TEST-DEV1-2024-DEMO`

**Organization:** Test Company  
**Contact Email:** test@example.com

**Status:** Active ✅  
**Expires:** October 13, 2026 (1 year from creation)

**Activation Limits:**
- Max Activations: 10
- Current Activations: 0

**Allowed Domains:**
- `localhost`
- `127.0.0.1`
- `localhost:5173`
- `127.0.0.1:5173`
- `*.netlify.app`
- `*.vercel.app`
- `*.supabase.co`

## How to Use This Key

### Option 1: Environment Variable (Recommended)
Add this to your `.env` file:
```
VITE_LICENSE_KEY=LIC-TEST-DEV1-2024-DEMO
```

### Option 2: Direct Configuration
If you need to hardcode it temporarily for testing, you can modify the license validation code to use this key directly.

## Notes

- This key allows up to 10 simultaneous device activations
- It works on localhost and common deployment platforms
- Valid for 1 year from creation
- Hardware fingerprints will be automatically tracked
- You can view activation history in the Admin Dashboard once you have access

## Next Steps

1. Add the license key to your environment variables
2. Restart your development server
3. The app should now load without license validation errors
4. Once you can access the admin dashboard, you can create additional keys as needed

## Troubleshooting

If you still see license validation errors:
- Make sure the environment variable is set correctly
- Check that you've restarted your dev server after adding the env variable
- Verify the domain matches one of the allowed domains
- Check browser console for specific validation error messages
