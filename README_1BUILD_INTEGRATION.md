# 1Build Real-Time Construction Materials Pricing Integration

## Overview

This application integrates with the **1Build API** to provide real-time, location-based construction material pricing data. 1Build tracks 68 million live construction materials, labor, and equipment costs for every county in the United States.

## Features

- **Real-Time Pricing**: Access current material costs updated continuously
- **Location-Based**: County-level pricing accuracy across all US states
- **Comprehensive Data**: Material, labor, and equipment costs
- **Smart Caching**: 24-hour cache to reduce API calls and improve performance
- **Search Functionality**: Search across millions of construction items
- **Category Browsing**: Explore materials by category hierarchy

## API Integration

### Endpoint
```
https://gateway-external.1build.com/
```

### Authentication
The API uses a header-based authentication system:
```
1build-api-key: YOUR_API_KEY_HERE
```

### GraphQL API
1Build uses GraphQL for all queries. The main queries are:

1. **sources** - Search for materials
2. **categoryTreeItems** - Browse category hierarchy
3. **source** - Get detailed information about a specific item

## Setup Instructions

### 1. Obtain API Key
Contact 1Build at help@1build.com to obtain your API key.

### 2. Configure Environment Variable
The API key is already configured as `ONEBUILD_API_KEY` in the Supabase edge function environment.

### 3. Database Tables
Two tables are created for caching and logging:

- `onebuild_pricing_cache` - Stores search results for 24 hours
- `onebuild_api_logs` - Tracks API usage and errors

## Usage

### Material Pricing Search Component
Search for materials with real-time pricing:

```tsx
import { MaterialPricingSearch } from '@/components/MaterialPricingSearch';

<MaterialPricingSearch />
```

Features:
- Search by material name
- Select state and county for location-based pricing
- View detailed cost breakdowns (material, labor, equipment)
- See source type and category information

### Enhanced Estimation Calculator
Calculate project estimates with live pricing:

```tsx
import { EnhancedEstimationCalculator } from '@/components/EnhancedEstimationCalculator';

<EnhancedEstimationCalculator />
```

Features:
- Toggle between live 1Build pricing and static pricing
- Location-based cost calculations
- Automatic material quantity calculations
- Detailed cost breakdown with labor and equipment

## Edge Function

The `rsmeans-pricing` edge function handles all 1Build API calls:

### Actions

1. **search** - Search for materials
```javascript
{
  action: 'search',
  searchTerm: 'concrete',
  state: 'California',
  county: 'Los Angeles County'
}
```

2. **getCategories** - Get category tree
```javascript
{
  action: 'getCategories',
  searchTerm: 'plumbing',
  categoryPath: '',
  state: 'California',
  county: 'Los Angeles County'
}
```

3. **getItem** - Get specific source details
```javascript
{
  action: 'getItem',
  sourceId: 'uuid-here'
}
```

## Data Structure

### Source Object
```typescript
{
  id: string;
  name: string;
  description?: string;
  calculatedUnitRateUsdCents: number;  // Total cost in cents
  laborRateUsdCents: number;
  materialRateUsdCents: number;
  equipmentRateUsdCents: number;
  unit: string;                        // e.g., "SF", "CY", "EA"
  sourceType: string;                  // MATERIAL, LABOR, EQUIPMENT, etc.
  categoryPath: string;
}
```

### Price Conversion
All prices are returned in USD cents. Convert to dollars:
```javascript
const dollars = priceInCents / 100;
```

## Supported Locations

The integration supports all US states and counties. Common examples:

- **California**: Los Angeles County, San Diego County, Orange County
- **Texas**: Harris County, Dallas County, Bexar County
- **Florida**: Miami-Dade County, Broward County
- **New York**: New York County, Kings County
- **Illinois**: Cook County, DuPage County

## Benefits

1. **Accuracy**: Real-time pricing eliminates estimation errors
2. **Location-Specific**: County-level data ensures local market accuracy
3. **Comprehensive**: Includes material, labor, and equipment costs
4. **Up-to-Date**: Continuously updated pricing data
5. **Extensive Database**: 68 million items across all construction categories

## Resources

- [1Build Website](https://www.1build.com/)
- [API Documentation](https://developer.1build.com/1build-api-reference/)
- [Support](mailto:help@1build.com)

## Notes

- Prices are cached for 24 hours to optimize performance
- All API calls are logged for monitoring and debugging
- The edge function handles authentication securely
- GraphQL queries are optimized for performance
