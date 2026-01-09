-- Fix Screen Recording Storage Issues
-- Run this in Supabase SQL Editor to fix storage bucket and policy issues

-- 1. Ensure the recordings bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing storage policies (if any)
DROP POLICY IF EXISTS "Users can upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete recordings" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Public can view recordings" ON storage.objects;

-- 3. Create new storage policies with proper permissions
CREATE POLICY "Authenticated users can upload recordings" 
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recordings' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their recordings" 
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recordings' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'recordings' AND public = true)
  )
);

CREATE POLICY "Users can delete their recordings" 
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recordings' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Verify recordings table exists with correct schema
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on recordings table
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- 6. Drop and recreate RLS policies for recordings table
DROP POLICY IF EXISTS "Users can view their own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can insert their own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can update their own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can delete their own recordings" ON recordings;

CREATE POLICY "Users can view their own recordings"
  ON recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
  ON recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
  ON recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
  ON recordings FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at DESC);

-- Verification queries (run these to check if everything is set up correctly)
-- SELECT * FROM storage.buckets WHERE id = 'recordings';
-- SELECT * FROM storage.policies WHERE bucket_id = 'recordings';
-- SELECT * FROM pg_policies WHERE tablename = 'recordings';
