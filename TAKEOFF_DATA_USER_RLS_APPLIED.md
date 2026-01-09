# Takeoff Data User-Based RLS Applied

## Changes Applied

### 1. Database Schema Updates
```sql
-- Added user_id column to takeoff_data
ALTER TABLE public.takeoff_data ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_takeoff_user ON public.takeoff_data(user_id);

-- Enabled RLS and granted permissions
ALTER TABLE public.takeoff_data ENABLE ROW LEVEL SECURITY;
GRANT INSERT, SELECT ON public.takeoff_data TO authenticated;

-- Created user-based RLS policies
CREATE POLICY "insert_own_takeoff" ON public.takeoff_data
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "select_own_takeoff" ON public.takeoff_data
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));
```

### 2. Edge Function Updates

**analyze-construction-plans function:**
- Now includes `user_id` when inserting takeoff_data records
- Implements field sanitization with allowed fields list
- Supports both plan-based and user-based access control

**Allowed Fields for Takeoff Data:**
```javascript
const allowed = new Set([
  'plan_id','user_id','page_number','item_type','description','quantity','unit',
  'dimensions','confidence_score','room_name','wall_type','ceiling_type',
  'linear_footage','wall_height','ceiling_area_sqft','door_material','door_size',
  'hardware_package','hardware_components','window_material','window_size',
  'notes','specifications','sheet_number','sheet_title','drawing_scale',
  'revision_number','revision_date','detail_references','section_references',
  'room_number','room_area','material_spec','raw_dimensions',
  'calculated_from_scale','scale_factor','plan_upload_id',
  'needs_clarification','clarification_notes','wall_classification',
  'cross_reference_notes','spec_reference','door_type','ceiling_type_detail',
  'ceiling_height','wall_materials','window_schedule_reference',
  'door_schedule_reference','organization_id','tenant_id'
]);
```

## Access Control Model

The system now uses **dual access control**:

1. **User-based RLS**: Users can only insert/select their own takeoff_data records
2. **Plan-based access**: Takeoff data is associated with plans via plan_id
3. **Organization/Tenant isolation**: Records include organization_id and tenant_id

## Benefits

✅ **Security**: Users can only access their own data
✅ **Sanitization**: Only allowed fields are inserted into database
✅ **Multi-tenant**: Organization and tenant isolation maintained
✅ **Auditing**: Clear ownership tracking via user_id

## Testing

Test the changes:
1. Upload a construction plan
2. Run vision extraction
3. Verify takeoff_data records include user_id
4. Confirm RLS policies prevent access to other users' data
