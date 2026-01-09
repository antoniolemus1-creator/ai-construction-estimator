# Screen Recording Diagnostics Guide

## Issue: Screen recordings not being saved/analyzed

### Common Causes and Solutions

#### 1. **Storage Bucket Not Created**
The `recordings` storage bucket might not exist in your Supabase project.

**Check:**
- Go to Supabase Dashboard → Storage
- Verify that a bucket named `recordings` exists
- Verify it's set to **Public**

**Fix:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;
```

#### 2. **Storage Policies Missing or Incorrect**
The storage policies control who can upload/view recordings.

**Check Current Policies:**
```sql
SELECT * FROM storage.policies WHERE bucket_id = 'recordings';
```

**Fix - Recreate Storage Policies:**
```sql
-- Delete existing policies
DROP POLICY IF EXISTS "Users can upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete recordings" ON storage.objects;

-- Recreate with correct permissions
CREATE POLICY "Users can upload recordings" 
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view recordings" 
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recordings' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR bucket_id IN (SELECT id FROM storage.buckets WHERE public = true)
  )
);

CREATE POLICY "Users can delete recordings" 
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3. **Database Table or RLS Issues**
The recordings table might not exist or RLS policies might be blocking inserts.

**Check Table:**
```sql
SELECT * FROM recordings LIMIT 1;
```

**Check RLS Policies:**
```sql
SELECT * FROM pg_policies WHERE tablename = 'recordings';
```

**Fix - Ensure Table and Policies Exist:**
Run the migration: `supabase/migrations/20240115000000_ai_training_tables.sql`

#### 4. **Browser Permissions**
The browser might not have permission to capture screen.

**Check:**
- Ensure you're using HTTPS (or localhost)
- Check browser console for permission errors
- Try in Chrome/Edge (best support for screen capture)

#### 5. **MediaRecorder API Issues**
Some browsers don't support certain codecs.

**The code already handles this:**
```typescript
const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
  ? 'video/webm;codecs=vp9' 
  : 'video/webm';
```

### Quick Diagnostic Steps

1. **Open Browser Console** (F12)
2. **Start a screen recording**
3. **Stop the recording**
4. **Check for errors** in the console

Look for:
- `Upload failed` - Storage bucket or policy issue
- `Save failed` - Database or RLS issue
- `Recording failed` - Browser permission issue

### Testing the Flow

Run this in browser console while on the app:
```javascript
// Test storage access
const { data, error } = await supabase.storage
  .from('recordings')
  .list(supabase.auth.user().id);
  
console.log('Storage test:', { data, error });

// Test database access
const { data: dbData, error: dbError } = await supabase
  .from('recordings')
  .select('*')
  .limit(1);
  
console.log('Database test:', { dbData, dbError });
```

### Most Likely Issue

Based on the code review, the most likely issue is:
**Storage bucket policies are blocking uploads**

The storage policies use `storage.foldername(name)` which extracts the folder from the path.
For a file like `user-id-123/1234567890.webm`, it should extract `user-id-123`.

If this doesn't match the authenticated user's ID, the upload will fail.

### Recommended Fix

Apply this SQL to ensure proper storage access:
```sql
-- Make bucket public
UPDATE storage.buckets SET public = true WHERE id = 'recordings';

-- Simplify storage policies for testing
DROP POLICY IF EXISTS "Users can upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view recordings" ON storage.objects;

CREATE POLICY "Authenticated users can upload recordings" 
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recordings' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view recordings" 
ON storage.objects FOR SELECT
USING (bucket_id = 'recordings');
```

After confirming recordings work, you can tighten the policies again.
