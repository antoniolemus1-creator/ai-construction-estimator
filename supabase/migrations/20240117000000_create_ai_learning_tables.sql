-- Create analyzed_videos table
CREATE TABLE IF NOT EXISTS analyzed_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  analysis_results JSONB,
  concepts_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create ai_learning_questions table
CREATE TABLE IF NOT EXISTS ai_learning_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  context TEXT,
  suggested_answer TEXT,
  user_answer TEXT,
  confidence_score DECIMAL(3,2) DEFAULT 0.5,
  status TEXT DEFAULT 'pending',
  source_type TEXT,
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  answered_at TIMESTAMPTZ
);

-- Create ai_learning_metrics table
CREATE TABLE IF NOT EXISTS ai_learning_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_concepts_learned INTEGER DEFAULT 0,
  concepts_confirmed INTEGER DEFAULT 0,
  concepts_corrected INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  average_confidence DECIMAL(3,2) DEFAULT 0,
  last_training_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_analyzed_videos_user_id ON analyzed_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_analyzed_videos_created_at ON analyzed_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_questions_user_id ON ai_learning_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_questions_status ON ai_learning_questions(status);

-- Enable RLS
ALTER TABLE analyzed_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own videos" ON analyzed_videos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own videos" ON analyzed_videos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own videos" ON analyzed_videos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own videos" ON analyzed_videos FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own questions" ON ai_learning_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own questions" ON ai_learning_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own questions" ON ai_learning_questions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users view own metrics" ON ai_learning_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own metrics" ON ai_learning_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own metrics" ON ai_learning_metrics FOR UPDATE USING (auth.uid() = user_id);
