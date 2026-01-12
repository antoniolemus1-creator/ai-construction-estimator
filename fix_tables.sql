-- Create ai_extraction_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_extraction_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  setting_name TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, setting_name)
);

-- Enable RLS
ALTER TABLE ai_extraction_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_extraction_settings
DROP POLICY IF EXISTS "Users can view own settings" ON ai_extraction_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON ai_extraction_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON ai_extraction_settings;

CREATE POLICY "Users can view own settings" ON ai_extraction_settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings" ON ai_extraction_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings" ON ai_extraction_settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Make sure plans table has proper column for name query
-- Add name column if it doesn't exist (might be called something else)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'name') THEN
    -- Check if there's a file_name or project_name column we can use
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'file_name') THEN
      ALTER TABLE plans ADD COLUMN name TEXT GENERATED ALWAYS AS (file_name) STORED;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'project_name') THEN  
      ALTER TABLE plans ADD COLUMN name TEXT GENERATED ALWAYS AS (project_name) STORED;
    ELSE
      ALTER TABLE plans ADD COLUMN name TEXT;
    END IF;
  END IF;
END $$;
