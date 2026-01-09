-- Add enhanced_data column to bulk_estimates table for storing detailed labor, equipment, and other costs
ALTER TABLE bulk_estimates 
ADD COLUMN IF NOT EXISTS enhanced_data JSONB DEFAULT NULL;

-- Add comment to explain the enhanced_data structure
COMMENT ON COLUMN bulk_estimates.enhanced_data IS 'Stores detailed estimate data including labor rates (union/open shop), supervision, per diem, equipment, insurance, permits, mobilization, overhead, and profit calculations';

-- Create index for enhanced estimates
CREATE INDEX IF NOT EXISTS idx_bulk_estimates_enhanced ON bulk_estimates(enhanced_data) WHERE enhanced_data IS NOT NULL;
