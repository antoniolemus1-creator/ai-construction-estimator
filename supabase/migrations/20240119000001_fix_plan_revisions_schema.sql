-- Fix existing tables or create new ones with proper schema

-- 1) Create enums if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_order_status') THEN
    CREATE TYPE change_order_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_order_priority') THEN
    CREATE TYPE change_order_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
END$$;

-- 2) Drop existing tables if they have wrong schema (safer to recreate)
DROP TABLE IF EXISTS plan_revisions CASCADE;
DROP TABLE IF EXISTS change_orders CASCADE;

-- 3) Create plan_revisions with correct schema
CREATE TABLE plan_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes_detected JSONB,
  cost_impact NUMERIC(12, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_revision_unique UNIQUE (user_id, plan_id, version_number)
);

-- 4) Create change_orders with correct schema
CREATE TABLE change_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  change_order_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status change_order_status NOT NULL DEFAULT 'draft',
  priority change_order_priority NOT NULL DEFAULT 'medium',
  requested_by TEXT,
  requested_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by TEXT,
  approved_date TIMESTAMPTZ,
  estimated_cost NUMERIC(12, 2),
  actual_cost NUMERIC(12, 2),
  estimated_days INTEGER CHECK (estimated_days IS NULL OR estimated_days >= 0),
  actual_days INTEGER CHECK (actual_days IS NULL OR actual_days >= 0),
  reason TEXT,
  impact_analysis TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT change_order_unique UNIQUE (user_id, project_name, change_order_number)
);

-- 5) Auto-update timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plan_revisions_set_updated_at
  BEFORE UPDATE ON plan_revisions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_change_orders_set_updated_at
  BEFORE UPDATE ON change_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6) Enable RLS
ALTER TABLE plan_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_orders ENABLE ROW LEVEL SECURITY;

-- 7) RLS Policies for plan_revisions
CREATE POLICY pr_select_own ON plan_revisions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY pr_insert_own ON plan_revisions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pr_update_own ON plan_revisions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pr_delete_own ON plan_revisions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 8) RLS Policies for change_orders
CREATE POLICY co_select_own ON change_orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY co_insert_own ON change_orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY co_update_own ON change_orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY co_delete_own ON change_orders
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 9) Create indexes for better performance
CREATE INDEX idx_plan_revisions_user_id ON plan_revisions(user_id);
CREATE INDEX idx_plan_revisions_plan_id ON plan_revisions(plan_id);
CREATE INDEX idx_change_orders_user_id ON change_orders(user_id);
CREATE INDEX idx_change_orders_status ON change_orders(status);
CREATE INDEX idx_change_orders_project ON change_orders(project_name);
