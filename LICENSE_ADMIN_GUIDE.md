# License Key Admin Panel Guide

## Overview
The License Key Admin Panel provides a comprehensive UI for managing license keys without writing SQL queries. Access it through the Admin Dashboard under the "License Keys" tab.

## Features

### 1. Create License Keys
- Click "Create License" button
- Auto-generates unique license key (format: LIC-XXXX-XXXX-XXXX-XXXX)
- Configure:
  - Company Name
  - Contact Email
  - Allowed Domains (comma-separated)
  - Max Activations (number of devices/servers)
  - Expiration Date

### 2. View License Details
- Click the shield icon on any license row
- View complete license information:
  - License key and status
  - Company and contact details
  - All allowed domains
  - Hardware fingerprints (all activated devices)
  - Activation count and limits
  - Creation and expiration dates

### 3. Reset Hardware Fingerprints
- Click the refresh icon on any license row
- Resets all hardware fingerprints to zero
- Allows re-activation on new devices
- Useful when client changes infrastructure

### 4. Deactivate Licenses
- Click the trash icon to deactivate
- Prevents further use of the license
- Does not delete the record (for audit trail)
- Can be reactivated by updating the license

### 5. License Status Monitoring
- Active/Inactive badge shows current status
- Activation counter shows usage (e.g., 2/5)
- Expiration date clearly displayed
- All changes logged automatically

## Common Workflows

### New Client Setup
1. Click "Create License"
2. Enter company details
3. Add allowed domains (e.g., client.example.com)
4. Set max activations (typically 1-5)
5. Set expiration (usually 1 year from now)
6. Save and provide license key to client

### Client Infrastructure Change
1. Find client's license in the table
2. Click refresh icon to reset fingerprints
3. Confirm the reset
4. Client can now activate on new infrastructure

### License Renewal
1. Find expiring license
2. Click shield icon to view details
3. Note the license key
4. Create new license with same details but new expiration
5. Provide new key to client

### Troubleshooting Activation Issues
1. View license details to check:
   - Is license active?
   - Has it expired?
   - Are activations maxed out?
   - Is client's domain in allowed list?
2. Reset fingerprints if needed
3. Update allowed domains if client changed infrastructure

## Security Notes
- Only Super Admin users can access this panel
- All operations are logged in system_logs table
- License keys are validated server-side
- Hardware fingerprints prevent unauthorized sharing
- Domain restrictions prevent deployment on wrong servers

## API Integration
The admin panel uses the `manage-license-keys` edge function which supports:
- `create` - Create new license
- `update` - Modify existing license
- `deactivate` - Disable license
- `reset_fingerprints` - Clear hardware fingerprints
- `list` - Get all licenses

All operations require admin authentication and are rate-limited for security.