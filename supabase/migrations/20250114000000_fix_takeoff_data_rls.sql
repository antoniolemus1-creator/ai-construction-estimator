-- Ensure takeoff_data table exists with proper structure
CREATE TABLE IF NOT EXISTS takeoff_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES construction_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number INTEGER,
  item_type TEXT,
  quantity NUMERIC,
  unit TEXT,
  dimensions TEXT,
  confidence_score NUMERIC,
  room_name TEXT,
  wall_type TEXT,
  ceiling_type TEXT,
  door_type TEXT,
  window_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add user_id if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='takeoff_data' AND column_name='user_id') THEN
    ALTER TABLE takeoff_data ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE takeoff_data ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users view own takeoff data" ON takeoff_data;
DROP POLICY IF EXISTS "Users insert own takeoff data" ON takeoff_data;
DROP POLICY IF EXISTS "Users update own takeoff data" ON takeoff_data;
DROP POLICY IF EXISTS "Users delete own takeoff data" ON takeoff_data;

-- Create RLS policies
CREATE POLICY "Users view own takeoff data" ON takeoff_data
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own takeoff data" ON takeoff_data
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own takeoff data" ON takeoff_data
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own takeoff data" ON takeoff_data
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Same for plan_conversations
CREATE TABLE IF NOT EXISTS plan_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES construction_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plan_conversations' AND column_name='user_id') THEN
    ALTER TABLE plan_conversations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE plan_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own conversations" ON plan_conversations;
DROP POLICY IF EXISTS "Users insert own conversations" ON plan_conversations;

CREATE POLICY "Users view own conversations" ON plan_conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own conversations" ON plan_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
