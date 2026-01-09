-- Verification Script for Vision Extraction Setup
-- Run this to ensure your database is properly configured

-- 1. Check takeoff_data table structure
SELECT 'Checking takeoff_data columns...' as status;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('tenant_id', 'organization_id', 'plan_id', 'item_type') 
    THEN '✓ REQUIRED' 
    ELSE 'optional' 
  END as importance
FROM information_schema.columns
WHERE table_name = 'takeoff_data'
  AND column_name IN (
    'tenant_id', 'organization_id', 'plan_id', 'user_id',
    'item_type', 'description', 'wall_type', 'ceiling_type',
    'door_type', 'window_type', 'quantity', 'unit'
  )
ORDER BY importance DESC, column_name;

-- 2. Verify RLS is enabled
SELECT 'Checking RLS status...' as status;
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as status
FROM pg_tables
WHERE tablename IN ('takeoff_data', 'plans')
  AND schemaname = 'public';

-- 3. Check RLS policies for INSERT
SELECT 'Checking INSERT policies...' as status;
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN with_check LIKE '%tenant_id%' THEN '✓ Uses tenant_id'
    WHEN with_check LIKE '%organization_id%' THEN '✓ Uses organization_id'
    WHEN with_check LIKE '%user_id%' THEN '⚠ Uses user_id (legacy)'
    ELSE '? Unknown policy'
  END as policy_type
FROM pg_policies
WHERE tablename = 'takeoff_data'
  AND cmd = 'INSERT';

-- 4. Check plans table structure
SELECT 'Checking plans table...' as status;
SELECT 
  column_name,
  data_type,
  CASE WHEN column_name IN ('id', 'user_id', 'tenant_id') 
    THEN '✓ REQUIRED' 
    ELSE 'optional' 
  END as importance
FROM information_schema.columns
WHERE table_name = 'plans'
  AND column_name IN ('id', 'user_id', 'tenant_id', 'organization_id')
ORDER BY importance DESC;

-- 5. Test data integrity
SELECT 'Checking existing data...' as status;
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT tenant_id) as unique_tenants,
  COUNT(DISTINCT organization_id) as unique_orgs,
  COUNT(*) FILTER (WHERE tenant_id IS NULL) as missing_tenant_id,
  COUNT(*) FILTER (WHERE plan_id IS NULL) as missing_plan_id
FROM takeoff_data;

-- 6. Verify api_usage_tracking exists
SELECT 'Checking API usage tracking...' as status;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'api_usage_tracking'
) as table_exists;

-- 7. Check for orphaned records
SELECT 'Checking for orphaned takeoff_data...' as status;
SELECT 
  COUNT(*) as orphaned_records
FROM takeoff_data t
WHERE NOT EXISTS (
  SELECT 1 FROM plans p WHERE p.id = t.plan_id
);

-- 8. Summary Report
SELECT 'SUMMARY REPORT' as status;
SELECT 
  '✓ Setup Complete' as message
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'takeoff_data' AND column_name = 'tenant_id'
)
AND EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE tablename = 'takeoff_data' AND cmd = 'INSERT'
)
UNION ALL
SELECT 
  '✗ Missing tenant_id column' as message
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'takeoff_data' AND column_name = 'tenant_id'
)
UNION ALL
SELECT 
  '✗ Missing INSERT policies' as message
WHERE NOT EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE tablename = 'takeoff_data' AND cmd = 'INSERT'
);
