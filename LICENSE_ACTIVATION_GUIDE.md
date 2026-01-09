# License Activation Guide

## Public License Activation System

Your application now has a public-facing license activation system that allows users to register their domains with email verification for security.

## How It Works

### 1. User Activation Flow

1. User visits `/activate-license`
2. Enters their license key and email address
3. System automatically detects current domain
4. Verification email is sent to the provided email
5. User clicks verification link in email
6. Domain is automatically added to license's allowed domains
7. User can now use the application

### 2. Pages Created

#### `/activate-license`
- Public page where users enter their license key
- Automatically detects current domain (window.location.hostname)
- Collects email for verification
- Beautiful UI with icons and clear instructions

#### `/verify-license`
- Handles email verification links
- Automatically verifies and activates the license
- Shows success/error status
- Redirects to dashboard on success

## Usage Instructions

### For End Users

1. Navigate to: `https://yourdomain.com/activate-license`
2. Enter your license key (format: XXXX-XXXX-XXXX-XXXX)
3. Enter your email address
4. Click "Send Verification Email"
5. Check your email inbox
6. Click the verification link
7. You're activated!

### For Administrators

The activation system uses the existing `activate-license` edge function which:
- Validates license keys
- Checks if license is active
- Generates verification tokens
- Sends emails via SendGrid
- Adds domains to allowed_domains array
- Tracks activation requests in database

## Security Features

✅ Email verification required
✅ Unique verification tokens
✅ One-time use tokens
✅ Domain automatically detected (can't be spoofed)
✅ License validation before activation
✅ Audit trail in license_activation_requests table

## Database Tables Used

- `license_keys` - Stores licenses and allowed_domains
- `license_activation_requests` - Tracks activation attempts and verification status

## Testing

To test the activation flow:

1. Create a test license key in admin panel
2. Visit `/activate-license`
3. Enter test license key and your email
4. Check email for verification link
5. Click link to complete activation

## Troubleshooting

**Email not received?**
- Check spam folder
- Verify SendGrid API key is configured
- Check system logs for email errors

**Verification failed?**
- Token may have expired
- Token may have been used already
- License key may be invalid or inactive

**Domain not authorized?**
- Complete activation flow first
- Check license_keys table for allowed_domains
- Domain must match exactly (no www vs non-www issues)

## Integration with Existing System

This activation system integrates seamlessly with:
- LicenseGuard component (validates on app load)
- Admin license management (view activation requests)
- Existing license validation logic
