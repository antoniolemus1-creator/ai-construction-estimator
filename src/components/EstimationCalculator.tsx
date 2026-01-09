import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileSignature, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProposalGenerator } from './ProposalGenerator';
import CalculationSettingsModal from './CalculationSettingsModal';
import { MetalFramingForm, MetalFramingSection } from './estimator/MetalFramingForm';
import { DrywallForm, DrywallSection } from './estimator/DrywallForm';
import { WoodFramingForm, WoodFramingSection } from './estimator/WoodFramingForm';
import { CeilingForm, CeilingSection } from './estimator/CeilingForm';
import { EstimateResults } from './estimator/EstimateResults';

export default function EstimationCalculator() {
  const [metalFramingSections, setMetalFramingSections] = useState<MetalFramingSection[]>([
    { id: '1', name: 'Metal Framing 1', linearFootage: '', height: '', onCenter: '16', customOnCenter: '', gauge: '25', coating: 'G40' }
  ]);
  const [drywallSections, setDrywallSections] = useState<DrywallSection[]>([
    { id: '1', name: 'Drywall 1', linearFootage: '', height: '', thickness: '0.5', drywallType: 'Standard', aboveCeiling: 'accessible' }
  ]);
  const [woodFramingSections, setWoodFramingSections] = useState<WoodFramingSection[]>([
    { id: '1', name: 'Wood Framing 1', linearFootage: '', height: '', onCenter: '16', customOnCenter: '', plates: '2', woodType: 'Standard' }
  ]);
  const [ceilingSections, setCeilingSections] = useState<CeilingSection[]>([
    { id: '1', name: 'Ceiling 1', squareFootage: '', type: 'ACT Low End' }
  ]);
  const [overheadPercent, setOverheadPercent] = useState('10');
  const [profitPercent, setProfitPercent] = useState('15');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [estimate, setEstimate] = useState<any>(null);
  const [showProposal, setShowProposal] = useState(false);
  const { toast } = useToast();

  const getSettings = () => {
    const stored = localStorage.getItem('calculationSettings');
    return stored ? JSON.parse(stored) : {
      metalFraming: { baseRate: 8, gaugeMultipliers: { '25': 1, '20': 1.1, '18': 1.2, '16': 1.3, '14': 1.4, '12': 1.5 }, coatingMultipliers: { 'G40': 1, 'G60': 1.05, 'G90': 1.1, 'Galvanized': 1.15, 'Bare': 0.9 } },
      drywall: { baseRate: 6, thicknessMultipliers: { '0.5': 1, '0.625': 1.1, '0.75': 1.2, '1': 1.3 }, typeMultipliers: { 'Standard': 1, 'Moisture Resistant': 1.15, 'Type X': 1.2, 'Type C': 1.25, 'Bulletproof': 2 }, ceilingMultipliers: { 'accessible': 1, 'not-accessible': 1.3 } },
      woodFraming: { baseRate: 7, typeMultipliers: { 'Standard': 1, 'Fire-Rated': 1.2, 'Pressure Treated': 1.15 }, platesMultiplier: 1.5 },
      ceiling: { rates: { 'ACT High End': 12, 'ACT Low End': 8, 'Metal Framed': 10, 'Wood Framed': 9, 'Drywall Grid': 11, 'Specialty': 15 } },
      labor: { hourlyRate: 45, hoursPerSqFt: 0.05 }
    };
  };

  const calculateEstimate = () => {
    const settings = getSettings();
    let metalFramingCost = 0;
    let drywallCost = 0;
    let woodFramingCost = 0;
    let ceilingCost = 0;
    const materials: any[] = [];

    metalFramingSections.forEach(s => {
      const lf = parseFloat(s.linearFootage) || 0;
      const h = parseFloat(s.height) || 0;
      const onCenter = s.onCenter === 'custom' ? (parseFloat(s.customOnCenter) || 16) : parseFloat(s.onCenter);
      const gaugeM = settings.metalFraming.gaugeMultipliers[s.gauge] || 1;
      const coatingM = settings.metalFraming.coatingMultipliers[s.coating] || 1;
      const numStuds = (lf * h) / onCenter;
      const unitPrice = settings.metalFraming.baseRate * gaugeM * coatingM;
      const materialCost = numStuds * unitPrice;
      metalFramingCost += materialCost;
      materials.push({ name: `${s.name} - Metal Studs (${s.gauge} gauge, ${s.coating})`, quantity: numStuds, unit: 'studs', unitPrice, total: materialCost });
    });

    drywallSections.forEach(s => {
      const lf = parseFloat(s.linearFootage) || 0;
      const h = parseFloat(s.height) || 0;
      const sqft = lf * h;
      const numSheets = sqft / 32; // 4x8 sheets
      const thickM = settings.drywall.thicknessMultipliers[s.thickness] || 1;
      const typeM = settings.drywall.typeMultipliers[s.drywallType] || 1;
      const ceilM = settings.drywall.ceilingMultipliers[s.aboveCeiling] || 1;
      const unitPrice = settings.drywall.baseRate * 32 * thickM * typeM * ceilM;
      const materialCost = sqft * settings.drywall.baseRate * thickM * typeM * ceilM;
      drywallCost += materialCost;
      materials.push({ name: `${s.name} - Drywall Sheets (${s.thickness}", ${s.drywallType})`, quantity: numSheets, unit: 'sheets', unitPrice, total: materialCost });
    });

    woodFramingSections.forEach(s => {
      const lf = parseFloat(s.linearFootage) || 0;
      const h = parseFloat(s.height) || 0;
      const sqft = lf * h;
      const onCenter = s.onCenter === 'custom' ? (parseFloat(s.customOnCenter) || 16) : parseFloat(s.onCenter);
      const numStuds = (lf * h) / onCenter;
      const typeM = settings.woodFraming.typeMultipliers[s.woodType] || 1;
      const plates = parseFloat(s.plates) || 0;
      const platesM = 1 + (plates * settings.woodFraming.platesMultiplier * 0.1);
      const unitPrice = settings.woodFraming.baseRate * (onCenter / 12) * typeM * platesM;
      const materialCost = sqft * settings.woodFraming.baseRate * typeM * platesM;
      woodFramingCost += materialCost;
      materials.push({ name: `${s.name} - Wood Studs (${s.woodType})`, quantity: numStuds, unit: 'studs', unitPrice, total: materialCost });
    });

    ceilingSections.forEach(s => {
      const sqft = parseFloat(s.squareFootage) || 0;
      const rate = settings.ceiling.rates[s.type] || 10;
      const materialCost = sqft * rate;
      ceilingCost += materialCost;
      materials.push({ name: `${s.name} - Ceiling (${s.type})`, quantity: sqft, unit: 'sq ft', unitPrice: rate, total: materialCost });
    });

    const totalSqft = [...metalFramingSections, ...drywallSections, ...woodFramingSections].reduce((sum, s) => {
      const lf = parseFloat(s.linearFootage) || 0;
      const h = parseFloat(s.height) || 0;
      return sum + (lf * h);
    }, 0) + ceilingSections.reduce((sum, s) => sum + (parseFloat(s.squareFootage) || 0), 0);

    const laborHours = totalSqft * settings.labor.hoursPerSqFt;
    const laborCost = laborHours * settings.labor.hourlyRate;
    materials.push({ name: 'Labor', quantity: laborHours, unit: 'hours', unitPrice: settings.labor.hourlyRate, total: laborCost });

    const subtotal = metalFramingCost + drywallCost + woodFramingCost + ceilingCost + laborCost;
    const overhead = subtotal * (parseFloat(overheadPercent) / 100);
    const profit = subtotal * (parseFloat(profitPercent) / 100);
    const total = subtotal + overhead + profit;

    setEstimate({ metalFramingCost, drywallCost, woodFramingCost, ceilingCost, laborCost, subtotal, overhead, profit, total, materials });
    toast({ title: 'Estimate Calculated', description: `Total: $${total.toFixed(2)}` });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Quick Estimate</CardTitle>
            <CardDescription>Calculate construction estimates quickly</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4 mr-2" />Settings</Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metal">
            <TabsList className="grid w-full grid-cols-4"><TabsTrigger value="metal">Metal Framing</TabsTrigger><TabsTrigger value="drywall">Drywall</TabsTrigger><TabsTrigger value="wood">Wood Framing</TabsTrigger><TabsTrigger value="ceiling">Ceiling</TabsTrigger></TabsList>
            <TabsContent value="metal" className="mt-4"><MetalFramingForm sections={metalFramingSections} onChange={setMetalFramingSections} /></TabsContent>
            <TabsContent value="drywall" className="mt-4"><DrywallForm sections={drywallSections} onChange={setDrywallSections} /></TabsContent>
            <TabsContent value="wood" className="mt-4"><WoodFramingForm sections={woodFramingSections} onChange={setWoodFramingSections} /></TabsContent>
            <TabsContent value="ceiling" className="mt-4"><CeilingForm sections={ceilingSections} onChange={setCeilingSections} /></TabsContent>
          </Tabs>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div><Label>Overhead %</Label><Input type="number" value={overheadPercent} onChange={(e) => setOverheadPercent(e.target.value)} /></div>
            <div><Label>Profit %</Label><Input type="number" value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} /></div>
          </div>
          <Button onClick={calculateEstimate} className="w-full mt-4">Calculate Estimate</Button>
        </CardContent>
      </Card>
      {estimate && (
        <>
          <EstimateResults {...estimate} />
          <Button onClick={() => setShowProposal(true)} className="w-full"><FileSignature className="mr-2 h-4 w-4" />Generate Proposal</Button>
        </>
      )}
      {showProposal && estimate && <ProposalGenerator estimate={estimate} onClose={() => setShowProposal(false)} />}
      <CalculationSettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
