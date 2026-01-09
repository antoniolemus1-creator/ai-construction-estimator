-- Create video analysis cache table
CREATE TABLE IF NOT EXISTS video_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES youtube_training_videos(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 4) DEFAULT 0,
  analyzed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  cache_hits INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id)
);

-- Create index for faster lookups
CREATE INDEX idx_video_analysis_cache_video_id ON video_analysis_cache(video_id);
CREATE INDEX idx_video_analysis_cache_expires_at ON video_analysis_cache(expires_at);

-- Create cache statistics table
CREATE TABLE IF NOT EXISTS cache_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  total_cache_hits INTEGER DEFAULT 0,
  total_tokens_saved INTEGER DEFAULT 0,
  total_cost_saved DECIMAL(10, 4) DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE video_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_statistics ENABLE ROW LEVEL SECURITY;

-- Policies for video_analysis_cache
CREATE POLICY "Users can view all cached analyses"
  ON video_analysis_cache FOR SELECT
  USING (true);

CREATE POLICY "Users can insert cache entries"
  ON video_analysis_cache FOR INSERT
  WITH CHECK (auth.uid() = analyzed_by);

CREATE POLICY "Users can update their cache entries"
  ON video_analysis_cache FOR UPDATE
  USING (auth.uid() = analyzed_by);

-- Policies for cache_statistics
CREATE POLICY "Users can view their own stats"
  ON cache_statistics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their stats"
  ON cache_statistics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their stats"
  ON cache_statistics FOR UPDATE
  USING (auth.uid() = user_id);
