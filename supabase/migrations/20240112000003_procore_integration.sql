-- Procore OAuth tokens and integration data
CREATE TABLE IF NOT EXISTS procore_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  company_id TEXT,
  company_name TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Procore project mappings
CREATE TABLE IF NOT EXISTS procore_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES procore_connections(id) ON DELETE CASCADE,
  procore_project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  project_number TEXT,
  company_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, procore_project_id)
);

-- Sync history
CREATE TABLE IF NOT EXISTS procore_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES procore_connections(id) ON DELETE CASCADE,
  project_id UUID REFERENCES procore_projects(id),
  sync_type TEXT NOT NULL, -- 'estimate', 'photo', 'analysis'
  status TEXT NOT NULL, -- 'success', 'failed'
  data JSONB,
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE procore_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE procore_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE procore_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own connections" ON procore_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their projects" ON procore_projects
  FOR SELECT USING (connection_id IN (SELECT id FROM procore_connections WHERE user_id = auth.uid()));

CREATE POLICY "Users can view their sync history" ON procore_sync_history
  FOR SELECT USING (connection_id IN (SELECT id FROM procore_connections WHERE user_id = auth.uid()));
