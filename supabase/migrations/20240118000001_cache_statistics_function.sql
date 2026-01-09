-- Function to increment cache statistics
CREATE OR REPLACE FUNCTION increment_cache_stats(
  p_user_id UUID,
  p_tokens_saved INTEGER,
  p_cost_saved DECIMAL
)
RETURNS void AS $$
BEGIN
  INSERT INTO cache_statistics (user_id, total_cache_hits, total_tokens_saved, total_cost_saved, last_updated_at)
  VALUES (p_user_id, 1, p_tokens_saved, p_cost_saved, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_cache_hits = cache_statistics.total_cache_hits + 1,
    total_tokens_saved = cache_statistics.total_tokens_saved + p_tokens_saved,
    total_cost_saved = cache_statistics.total_cost_saved + p_cost_saved,
    last_updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on user_id for cache_statistics
ALTER TABLE cache_statistics ADD CONSTRAINT cache_statistics_user_id_key UNIQUE (user_id);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM video_analysis_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
