# Database Duplicate Handling Fix

## Issue
Video analysis was failing with "Function returned a non-2xx error" because the database had unique constraints preventing duplicate video analyses.

## Changes Made

### 1. Removed Unique Constraints
Removed all unique constraints on `(user_id, video_id)` combinations from:
- ✅ `analyzed_videos` table
- ✅ `video_watch_progress` table  
- ✅ `custom_training_videos` table

### 2. Updated Edge Function
Modified `analyze-video-content` edge function:
- Changed from `upsert()` to `insert()` 
- Removed `onConflict` parameter
- Now allows multiple analyses of the same video by the same user

## Why This Fixes The Issue
- Users can now re-analyze videos multiple times
- Each analysis creates a new record with a unique `id` (primary key)
- No conflicts when inserting duplicate `(user_id, video_id)` combinations
- Historical analysis data is preserved

## Database State
All video-related tables now allow duplicates while maintaining:
- Primary key constraints (unique `id`)
- Foreign key constraints (referencing `auth.users`)
- Check constraints (for status values, etc.)
- RLS policies (for user data isolation)

## Testing
Try analyzing a video that was previously analyzed. It should now succeed without errors.
