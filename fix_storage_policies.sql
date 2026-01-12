-- Fix storage bucket policies for construction-plans
-- Run this in Supabase SQL Editor

-- First, ensure the bucket exists and is configured correctly
INSERT INTO storage.buckets (id, name, public)
VALUES ('construction-plans', 'construction-plans', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Drop ALL existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete" ON storage.objects;

-- Simple policies: All authenticated users can access construction-plans bucket
-- Files stored at root level with timestamp prefix

-- Policy: Authenticated users can upload files
CREATE POLICY "authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'construction-plans');

-- Policy: Authenticated users can read files
CREATE POLICY "authenticated_select"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'construction-plans');

-- Policy: Authenticated users can update files
CREATE POLICY "authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'construction-plans');

-- Policy: Authenticated users can delete files
CREATE POLICY "authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'construction-plans');
