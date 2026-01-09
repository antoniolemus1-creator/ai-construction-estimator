-- Video Annotations Schema
CREATE TABLE IF NOT EXISTS video_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES screen_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('marker', 'label', 'drawing', 'voice_note', 'highlight', 'workflow_step')),
  title TEXT,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  color TEXT DEFAULT '#f59e0b',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Documentation
CREATE TABLE IF NOT EXISTS workflow_documentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES screen_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_annotations_recording ON video_annotations(recording_id);
CREATE INDEX idx_annotations_timestamp ON video_annotations(timestamp_ms);
CREATE INDEX idx_workflow_recording ON workflow_documentation(recording_id);

-- RLS Policies
ALTER TABLE video_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_documentation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own annotations"
  ON video_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own annotations"
  ON video_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
  ON video_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
  ON video_annotations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workflows"
  ON workflow_documentation FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows"
  ON workflow_documentation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
  ON workflow_documentation FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
  ON workflow_documentation FOR DELETE
  USING (auth.uid() = user_id);
