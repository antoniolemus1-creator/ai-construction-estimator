-- Create bulk_estimates table for storing material import estimates
CREATE TABLE IF NOT EXISTS bulk_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  markup_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  markup_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  state TEXT,
  county TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_bulk_estimates_user_id ON bulk_estimates(user_id);
CREATE INDEX idx_bulk_estimates_created_at ON bulk_estimates(created_at DESC);

-- Enable RLS
ALTER TABLE bulk_estimates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bulk estimates"
  ON bulk_estimates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bulk estimates"
  ON bulk_estimates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bulk estimates"
  ON bulk_estimates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bulk estimates"
  ON bulk_estimates FOR DELETE
  USING (auth.uid() = user_id);
