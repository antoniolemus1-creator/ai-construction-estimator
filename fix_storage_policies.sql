-- Fix storage bucket policies for construction-plans

-- First, ensure the bucket exists and is configured correctly
INSERT INTO storage.buckets (id, name, public)
VALUES ('construction-plans', 'construction-plans', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read" ON storage.objects;

-- Policy: Authenticated users can upload files to their own folder
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'construction-plans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files (needed for signed URLs)
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'construction-plans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'construction-plans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'construction-plans'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
