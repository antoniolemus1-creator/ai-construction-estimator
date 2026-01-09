# Takeoff Data Insert Guide - Best Practices

## ✅ Correct Way to Insert Takeoff Data

### Step 1: Fetch Plan Details
Always fetch the plan first to get tenant and organization context:

```typescript
const { data: plan, error: planError } = await supabaseClient
  .from('plans')
  .select('user_id, tenant_id, organization_id')
  .eq('id', planId)
  .single();

if (planError || !plan) {
  throw new Error('Plan not found or access denied');
}
```

### Step 2: Create Base Item with RLS Fields
```typescript
const baseItem = {
  plan_id: planId,
  tenant_id: plan.tenant_id || user.id,  // REQUIRED for RLS
  organization_id: plan.organization_id || null,
  page_number: pageNumber || 1
};
```

### Step 3: Add Item-Specific Data
```typescript
const items = [];

// Wall example
items.push({
  ...baseItem,
  item_type: 'wall',
  quantity: 100.5,
  unit: 'LF',
  wall_type: 'Interior Partition',
  room_name: 'Office 101',
  confidence_score: 0.95
});

// Door example
items.push({
  ...baseItem,
  item_type: 'door',
  quantity: 1,
  unit: 'EA',
  description: 'Solid Core Wood Door',
  room_name: 'Office 101'
});
```

### Step 4: Insert with Error Handling
```typescript
const { data, error } = await supabaseClient
  .from('takeoff_data')
  .insert(items)
  .select();

if (error) {
  console.error('Insert failed:', error.message, error.details);
  throw new Error(`Database insert failed: ${error.message}`);
}

console.log(`Successfully inserted ${data.length} items`);
```

## ❌ Common Mistakes to Avoid

### 1. Using user_id
```typescript
// ❌ WRONG - user_id column doesn't exist
items.push({
  plan_id: planId,
  user_id: user.id,  // This will fail!
  item_type: 'wall'
});

// ✅ CORRECT - use tenant_id
items.push({
  plan_id: planId,
  tenant_id: user.id,  // This works!
  item_type: 'wall'
});
```

### 2. Missing RLS Fields
```typescript
// ❌ WRONG - RLS will block this
items.push({
  plan_id: planId,
  item_type: 'wall',
  quantity: 100
});

// ✅ CORRECT - includes tenant_id
items.push({
  plan_id: planId,
  tenant_id: plan.tenant_id || user.id,
  item_type: 'wall',
  quantity: 100
});
```

### 3. Using Non-Existent Columns
```typescript
// ❌ WRONG - these columns don't exist
items.push({
  item_type: 'door',
  door_type: 'Wood',  // Column doesn't exist!
  window_type: 'Vinyl'  // Column doesn't exist!
});

// ✅ CORRECT - use description or specific columns
items.push({
  item_type: 'door',
  description: 'Wood Door',  // Use description
  door_material: 'Wood'  // Or specific columns
});
```

## Required Fields

### Minimum Required
- `plan_id` (uuid) - Links to plans table
- `tenant_id` (uuid) - Required for RLS
- `item_type` (text) - Type of item
- `page_number` (integer) - Page in document

### Recommended
- `organization_id` (uuid) - For org-based access
- `quantity` (numeric) - Amount/measurement
- `unit` (text) - Unit of measurement
- `confidence_score` (numeric) - AI confidence (0-1)

## Item Types and Their Fields

### Wall Items
```typescript
{
  item_type: 'wall',
  quantity: 100.5,  // Linear feet
  unit: 'LF',
  wall_type: 'Interior Partition',
  room_name: 'Office 101',
  wall_height: 9,
  dimensions: { length_ft: 100.5, height_ft: 9 }
}
```

### Ceiling Items
```typescript
{
  item_type: 'ceiling',
  quantity: 144,  // Square feet
  unit: 'SF',
  ceiling_type: 'ACT Grid',
  room_name: 'Conference Room',
  ceiling_height: 9
}
```

### Door Items
```typescript
{
  item_type: 'door',
  quantity: 1,
  unit: 'EA',
  description: 'Solid Core Wood Door',
  door_material: 'Wood',
  door_size: '3070',
  room_name: 'Office 101'
}
```

### Window Items
```typescript
{
  item_type: 'window',
  quantity: 2,
  unit: 'EA',
  description: 'Vinyl Double Hung',
  window_material: 'Vinyl',
  window_size: '3050',
  room_name: 'Office 101'
}
```

### Specification Items
```typescript
{
  item_type: 'specification',
  description: 'Paint - Interior Walls',
  specifications: 'Two coats latex paint',
  quantity: '1000 SF',
  unit: 'LS',
  notes: 'Division 09 - Section 09 91 00'
}
```

## RLS Policy Requirements

The insert will succeed if ANY of these conditions are true:
1. `tenant_id = auth.uid()`
2. `organization_id` is in user's organizations
3. `plan_id` belongs to a plan owned by the user

**Best Practice**: Always set `tenant_id` to ensure RLS passes.

## Error Handling

```typescript
try {
  const { data, error } = await supabaseClient
    .from('takeoff_data')
    .insert(items)
    .select();

  if (error) {
    // Log full error details
    console.error('Insert error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    
    // Return user-friendly message
    throw new Error(`Failed to save data: ${error.message}`);
  }

  return { success: true, count: data.length };
} catch (err) {
  console.error('Unexpected error:', err);
  throw err;
}
```

## Testing Checklist

- [ ] Plan exists and user has access
- [ ] tenant_id is set correctly
- [ ] All column names are valid
- [ ] item_type is one of: wall, ceiling, door, window, specification
- [ ] quantity and unit are appropriate
- [ ] RLS policies allow the insert
- [ ] Error handling catches and logs issues
