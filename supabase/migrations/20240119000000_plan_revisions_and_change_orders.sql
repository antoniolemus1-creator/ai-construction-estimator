-- Create plan_revisions table
CREATE TABLE IF NOT EXISTS plan_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  changes_detected JSONB,
  cost_impact NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create change_orders table
CREATE TABLE IF NOT EXISTS change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  change_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  priority TEXT DEFAULT 'medium',
  requested_by TEXT,
  requested_date TIMESTAMPTZ DEFAULT NOW(),
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  estimated_cost NUMERIC(12, 2),
  actual_cost NUMERIC(12, 2),
  estimated_days INTEGER,
  actual_days INTEGER,
  reason TEXT,
  impact_analysis TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE plan_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plan_revisions
CREATE POLICY "Users can view their own plan revisions"
  ON plan_revisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan revisions"
  ON plan_revisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan revisions"
  ON plan_revisions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan revisions"
  ON plan_revisions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for change_orders
CREATE POLICY "Users can view their own change orders"
  ON change_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own change orders"
  ON change_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own change orders"
  ON change_orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own change orders"
  ON change_orders FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plan_revisions_user_id ON plan_revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_revisions_plan_id ON plan_revisions(plan_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_user_id ON change_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_change_orders_status ON change_orders(status);
