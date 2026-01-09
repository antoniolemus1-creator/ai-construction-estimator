import { useState } from 'react';
import { Search, MapPin, TrendingUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface OneBuildSource {
  id: string;
  name: string;
  description?: string;
  calculatedUnitRateUsdCents: number;
  laborRateUsdCents: number;
  materialRateUsdCents: number;
  equipmentRateUsdCents: number;
  unit: string;
  sourceType: string;
  categoryPath: string;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const COUNTIES_BY_STATE: Record<string, string[]> = {
  'Alabama': ['Jefferson County', 'Mobile County', 'Madison County', 'Montgomery County'],
  'Alaska': ['Anchorage Municipality', 'Fairbanks North Star Borough', 'Matanuska-Susitna Borough'],
  'Arizona': ['Maricopa County', 'Pima County', 'Pinal County', 'Yavapai County'],
  'Arkansas': ['Pulaski County', 'Benton County', 'Washington County', 'Faulkner County'],
  'California': ['Los Angeles County', 'San Diego County', 'Orange County', 'San Francisco County', 'Riverside County', 'San Bernardino County'],
  'Colorado': ['Denver County', 'El Paso County', 'Arapahoe County', 'Jefferson County'],
  'Connecticut': ['Fairfield County', 'Hartford County', 'New Haven County', 'New London County'],
  'Delaware': ['New Castle County', 'Sussex County', 'Kent County'],
  'Florida': ['Miami-Dade County', 'Broward County', 'Palm Beach County', 'Hillsborough County', 'Orange County', 'Pinellas County'],
  'Georgia': ['Fulton County', 'Gwinnett County', 'Cobb County', 'DeKalb County'],
  'Hawaii': ['Honolulu County', 'Hawaii County', 'Maui County', 'Kauai County'],
  'Idaho': ['Ada County', 'Canyon County', 'Kootenai County', 'Bonneville County'],
  'Illinois': ['Cook County', 'DuPage County', 'Lake County', 'Will County'],
  'Indiana': ['Marion County', 'Lake County', 'Allen County', 'Hamilton County'],
  'Iowa': ['Polk County', 'Linn County', 'Scott County', 'Johnson County'],
  'Kansas': ['Johnson County', 'Sedgwick County', 'Shawnee County', 'Wyandotte County'],
  'Kentucky': ['Jefferson County', 'Fayette County', 'Kenton County', 'Boone County'],
  'Louisiana': ['Orleans Parish', 'Jefferson Parish', 'East Baton Rouge Parish', 'Caddo Parish'],
  'Maine': ['Cumberland County', 'York County', 'Penobscot County', 'Kennebec County'],
  'Maryland': ['Montgomery County', 'Prince Georges County', 'Baltimore County', 'Anne Arundel County'],
  'Massachusetts': ['Middlesex County', 'Worcester County', 'Essex County', 'Suffolk County'],
  'Michigan': ['Wayne County', 'Oakland County', 'Macomb County', 'Kent County'],
  'Minnesota': ['Hennepin County', 'Ramsey County', 'Dakota County', 'Anoka County'],
  'Mississippi': ['Hinds County', 'Harrison County', 'DeSoto County', 'Jackson County'],
  'Missouri': ['St. Louis County', 'Jackson County', 'St. Charles County', 'Greene County'],
  'Montana': ['Yellowstone County', 'Missoula County', 'Gallatin County', 'Flathead County'],
  'Nebraska': ['Douglas County', 'Lancaster County', 'Sarpy County', 'Hall County'],
  'Nevada': ['Clark County', 'Washoe County', 'Carson City', 'Lyon County'],
  'New Hampshire': ['Hillsborough County', 'Rockingham County', 'Merrimack County', 'Strafford County'],
  'New Jersey': ['Bergen County', 'Essex County', 'Middlesex County', 'Hudson County'],
  'New Mexico': ['Bernalillo County', 'Dona Ana County', 'Santa Fe County', 'Sandoval County'],
  'New York': ['New York County', 'Kings County', 'Queens County', 'Bronx County', 'Nassau County', 'Suffolk County'],
  'North Carolina': ['Mecklenburg County', 'Wake County', 'Guilford County', 'Forsyth County'],
  'North Dakota': ['Cass County', 'Burleigh County', 'Grand Forks County', 'Ward County'],
  'Ohio': ['Cuyahoga County', 'Franklin County', 'Hamilton County', 'Summit County'],
  'Oklahoma': ['Oklahoma County', 'Tulsa County', 'Cleveland County', 'Canadian County'],
  'Oregon': ['Multnomah County', 'Washington County', 'Clackamas County', 'Lane County'],
  'Pennsylvania': ['Philadelphia County', 'Allegheny County', 'Montgomery County', 'Bucks County'],
  'Rhode Island': ['Providence County', 'Kent County', 'Washington County', 'Newport County'],
  'South Carolina': ['Greenville County', 'Richland County', 'Charleston County', 'Horry County'],
  'South Dakota': ['Minnehaha County', 'Pennington County', 'Lincoln County', 'Brookings County'],
  'Tennessee': ['Shelby County', 'Davidson County', 'Knox County', 'Hamilton County'],
  'Texas': ['Harris County', 'Dallas County', 'Bexar County', 'Travis County', 'Tarrant County', 'Collin County'],
  'Utah': ['Salt Lake County', 'Utah County', 'Davis County', 'Weber County'],
  'Vermont': ['Chittenden County', 'Rutland County', 'Washington County', 'Windsor County'],
  'Virginia': ['Fairfax County', 'Virginia Beach City', 'Prince William County', 'Loudoun County'],
  'Washington': ['King County', 'Pierce County', 'Snohomish County', 'Spokane County'],
  'West Virginia': ['Kanawha County', 'Berkeley County', 'Cabell County', 'Wood County'],
  'Wisconsin': ['Milwaukee County', 'Dane County', 'Waukesha County', 'Brown County'],
  'Wyoming': ['Laramie County', 'Natrona County', 'Campbell County', 'Sweetwater County']
};


export function MaterialPricingSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [state, setState] = useState('California');
  const [county, setCounty] = useState('Los Angeles County');
  const [results, setResults] = useState<OneBuildSource[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rsmeans-pricing', {
        body: {
          action: 'search',
          searchTerm: searchTerm.trim(),
          state,
          county
        }
      });

      if (error) throw error;

      if (data.sources?.nodes) {
        setResults(data.sources.nodes);
        toast.success(`Found ${data.sources.nodes.length} items`);
      } else {
        setResults([]);
        toast.info('No results found');
      }
    } catch (error: any) {
      console.error('Pricing search error:', error);
      toast.error(error.message || 'Failed to fetch pricing data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            1Build Real-Time Material Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="md:col-span-2"
            />
            <Select value={state} onValueChange={(v) => { setState(v); setCounty(COUNTIES_BY_STATE[v][0]); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={county} onValueChange={setCounty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTIES_BY_STATE[state]?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} disabled={loading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {loading ? 'Searching...' : 'Search 1Build Database'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid gap-4">
          {results.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline"><Package className="h-3 w-3 mr-1" />{item.sourceType}</Badge>
                      <Badge>{item.unit}</Badge>
                    </div>
                    <p className="font-medium text-lg">{item.name}</p>
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{item.categoryPath}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-3xl font-bold text-primary">
                      ${(item.calculatedUnitRateUsdCents / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">per {item.unit}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Material</div>
                    <div className="font-medium">${(item.materialRateUsdCents / 100).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Labor</div>
                    <div className="font-medium">${(item.laborRateUsdCents / 100).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Equipment</div>
                    <div className="font-medium">${(item.equipmentRateUsdCents / 100).toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
