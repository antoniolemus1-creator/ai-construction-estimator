-- Create datasets table for training data uploads
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  row_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recordings table for screen recordings

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

-- Create training_jobs table for AI model training
CREATE TABLE IF NOT EXISTS training_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  current_step TEXT,
  features JSONB,
  model_metrics JSONB,
  model_version TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_datasets_created_at ON datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_jobs_user_id ON training_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_status ON training_jobs(status);

-- Enable RLS
-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets"
  ON datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = user_id);


-- RLS Policies for recordings
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

-- RLS Policies for training_jobs
CREATE POLICY "Users can view their own training jobs"
  ON training_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training jobs"
  ON training_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training jobs"
  ON training_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true),
       ('training-datasets', 'training-datasets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for recordings
CREATE POLICY "Users can upload recordings" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view recordings" ON storage.objects FOR SELECT
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete recordings" ON storage.objects FOR DELETE
  USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for datasets
CREATE POLICY "Users can upload datasets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view datasets" ON storage.objects FOR SELECT
  USING (bucket_id = 'training-datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete datasets" ON storage.objects FOR DELETE
  USING (bucket_id = 'training-datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

