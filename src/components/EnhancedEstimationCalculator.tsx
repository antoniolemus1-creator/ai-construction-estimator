import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Brain, DollarSign, Loader2, RefreshCw, FileSignature } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProposalGenerator } from './ProposalGenerator';

interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  realTimePrice?: number;
  staticPrice: number;
  totalCost: number;
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

const COUNTIES: Record<string, string[]> = {
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


export function EnhancedEstimationCalculator() {
  const [squareFootage, setSquareFootage] = useState('2000');
  const [state, setState] = useState('California');
  const [county, setCounty] = useState('Los Angeles County');
  const [projectType, setProjectType] = useState('residential');
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [useLivePricing, setUseLivePricing] = useState(true);
  const [showProposalGenerator, setShowProposalGenerator] = useState(false);

  const fetchLivePricing = async (materialName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('rsmeans-pricing', {
        body: { action: 'search', searchTerm: materialName, state, county }
      });
      if (error) throw error;
      if (data.sources?.nodes?.length > 0) {
        return data.sources.nodes[0].calculatedUnitRateUsdCents / 100;
      }
      return null;
    } catch (error) {
      console.error('Live pricing error:', error);
      return null;
    }
  };

  const calculateEstimate = async () => {
    setLoading(true);
    try {
      const sqft = parseInt(squareFootage);
      const baseMaterials = [
        { name: 'concrete', quantity: sqft * 0.15, unit: 'CY', staticPrice: 125 },
        { name: 'lumber', quantity: sqft * 2.5, unit: 'BF', staticPrice: 3.5 },
        { name: 'drywall', quantity: sqft * 1.1, unit: 'SF', staticPrice: 1.2 },
        { name: 'roofing shingles', quantity: sqft * 0.3, unit: 'SQ', staticPrice: 85 },
        { name: 'insulation', quantity: sqft * 1.0, unit: 'SF', staticPrice: 0.75 }
      ];

      const materialsWithPricing: MaterialItem[] = [];
      for (const mat of baseMaterials) {
        let realTimePrice = null;
        if (useLivePricing) {
          realTimePrice = await fetchLivePricing(mat.name);
        }
        const pricePerUnit = realTimePrice || mat.staticPrice;
        materialsWithPricing.push({
          ...mat,
          realTimePrice,
          totalCost: mat.quantity * pricePerUnit
        });
      }

      setMaterials(materialsWithPricing);
      toast.success('Estimate calculated with ' + (useLivePricing ? '1Build live' : 'static') + ' pricing');
    } catch (error: any) {
      toast.error('Failed to calculate estimate');
    } finally {
      setLoading(false);
    }
  };

  const totalMaterialCost = materials.reduce((sum, m) => sum + m.totalCost, 0);
  const laborCost = totalMaterialCost * 0.45;
  const equipmentCost = totalMaterialCost * 0.15;
  const totalCost = totalMaterialCost + laborCost + equipmentCost;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Enhanced Estimation with 1Build Live Pricing
          </CardTitle>
          <CardDescription>Real-time material costs from 1Build database</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Square Footage</Label>
              <Input type="number" value={squareFootage} onChange={(e) => setSquareFootage(e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Select value={state} onValueChange={(v) => { setState(v); setCounty(COUNTIES[v][0]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>County</Label>
              <Select value={county} onValueChange={setCounty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTIES[state]?.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project Type</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={useLivePricing} onChange={(e) => setUseLivePricing(e.target.checked)} className="rounded" />
            <Label>Use 1Build live pricing data</Label>
          </div>

          <Button onClick={calculateEstimate} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculating...</> : 
            <><RefreshCw className="w-4 h-4 mr-2" />Calculate Estimate</>}
          </Button>
        </CardContent>
      </Card>

      {materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Cost Breakdown</CardTitle>
            <CardDescription>
              {useLivePricing && <Badge variant="default" className="mr-2">1Build Live Pricing</Badge>}
              Total: ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="materials">
              <TabsList>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="materials" className="space-y-3">
                {materials.map((mat, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium capitalize">{mat.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {mat.quantity.toFixed(1)} {mat.unit} × ${(mat.realTimePrice || mat.staticPrice).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${mat.totalCost.toFixed(2)}</div>
                      {mat.realTimePrice && <Badge variant="outline" className="text-xs"><DollarSign className="w-3 h-3 mr-1" />Live</Badge>}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="summary" className="space-y-3">
                <div className="flex justify-between p-3 border rounded">
                  <span>Materials</span>
                  <span className="font-bold">${totalMaterialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 border rounded">
                  <span>Labor (45%)</span>
                  <span className="font-bold">${laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-3 border rounded">
                  <span>Equipment (15%)</span>
                  <span className="font-bold">${equipmentCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="text-lg font-semibold">Total Project Cost</span>
                  <span className="text-2xl font-bold">${totalCost.toFixed(2)}</span>
                </div>
                <div className="mt-4">
                  <Button onClick={() => setShowProposalGenerator(true)} className="w-full" variant="outline">
                    <FileSignature className="w-4 h-4 mr-2" />
                    Generate Proposal
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {materials.length > 0 && (
        <ProposalGenerator
          open={showProposalGenerator}
          onOpenChange={setShowProposalGenerator}
          projectName={`${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Construction Project - ${squareFootage} sq ft`}
          materials={materials.map(m => ({
            name: m.name.charAt(0).toUpperCase() + m.name.slice(1),
            quantity: m.quantity,
            unit: m.unit,
            unitPrice: m.realTimePrice || m.staticPrice,
            totalPrice: m.totalCost
          }))}
          subtotal={totalMaterialCost}
          taxAmount={totalCost * 0.08}
          markupAmount={totalCost * 0.1}
          total={totalCost * 1.18}
          state={state}
          county={county}
        />
      )}
    </div>
  );
}
