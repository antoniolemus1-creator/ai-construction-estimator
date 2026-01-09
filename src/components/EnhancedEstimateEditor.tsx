import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Save, Calculator, Users, DollarSign, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Material {
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
}

interface EnhancedEstimateEditorProps {
  materials: Material[];
  projectName: string;
  onSave?: (data: any) => void;
}

export default function EnhancedEstimateEditor({ materials, projectName, onSave }: EnhancedEstimateEditorProps) {
  const [editedMaterials, setEditedMaterials] = useState(materials);
  const [isUnion, setIsUnion] = useState(false);
  const [laborRate, setLaborRate] = useState(isUnion ? 65 : 45);
  const [laborHours, setLaborHours] = useState(160);
  const [supervisionRate, setSupervisionRate] = useState(85);
  const [supervisionHours, setSupervisionHours] = useState(40);
  const [perDiemRate, setPerDiemRate] = useState(75);
  const [perDiemDays, setPerDiemDays] = useState(20);
  const [equipmentDaily, setEquipmentDaily] = useState(500);
  const [equipmentDays, setEquipmentDays] = useState(15);
  const [insuranceBond, setInsuranceBond] = useState(5000);
  const [permits, setPermits] = useState(2500);
  const [mobilization, setMobilization] = useState(3000);
  const [overheadPercent, setOverheadPercent] = useState(10);
  const [profitPercent, setProfitPercent] = useState(15);
  const [taxRate, setTaxRate] = useState(8.5);
  const { toast } = useToast();

  const handleUnionToggle = (checked: boolean) => {
    setIsUnion(checked);
    setLaborRate(checked ? 65 : 45);
  };

  const updateMaterialPrice = (index: number, newPrice: number) => {
    const updated = [...editedMaterials];
    updated[index].unitPrice = newPrice;
    updated[index].totalPrice = newPrice * updated[index].quantity;
    setEditedMaterials(updated);
  };

  const materialsSubtotal = editedMaterials.reduce((sum, m) => sum + (m.totalPrice || 0), 0);
  const laborCost = laborRate * laborHours;
  const supervisionCost = supervisionRate * supervisionHours;
  const perDiemCost = perDiemRate * perDiemDays;
  const equipmentCost = equipmentDaily * equipmentDays;
  
  const directCosts = materialsSubtotal + laborCost + supervisionCost + perDiemCost + equipmentCost + insuranceBond + permits + mobilization;
  const overhead = directCosts * (overheadPercent / 100);
  const subtotalWithOverhead = directCosts + overhead;
  const profit = subtotalWithOverhead * (profitPercent / 100);
  const taxAmount = subtotalWithOverhead * (taxRate / 100);
  const grandTotal = subtotalWithOverhead + profit + taxAmount;

  const handleSave = () => {
    const estimateData = {
      projectName, materials: editedMaterials, isUnion, laborRate, laborHours, laborCost,
      supervisionRate, supervisionHours, supervisionCost, perDiemRate, perDiemDays, perDiemCost,
      equipmentDaily, equipmentDays, equipmentCost, insuranceBond, permits, mobilization,
      overheadPercent, overhead, profitPercent, profit, taxRate, taxAmount, grandTotal
    };
    onSave?.(estimateData);
    toast({ title: 'Success', description: 'Estimate saved with custom rates' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Enhanced Estimate Editor - {projectName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="materials" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
            <TabsTrigger value="costs">Other Costs</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {editedMaterials.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>{m.quantity}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell>
                      <Input type="number" step="0.01" value={m.unitPrice || 0} 
                        onChange={(e) => updateMaterialPrice(i, parseFloat(e.target.value))} 
                        className="w-24" />
                    </TableCell>
                    <TableCell>${(m.totalPrice || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="text-right font-bold">Materials Subtotal: ${materialsSubtotal.toFixed(2)}</div>
          </TabsContent>

          <TabsContent value="labor" className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Users className="w-5 h-5" />
              <Label>Union Project</Label>
              <Switch checked={isUnion} onCheckedChange={handleUnionToggle} />
              <Badge variant={isUnion ? 'default' : 'secondary'}>{isUnion ? 'Union' : 'Open Shop'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Base Labor Rate ($/hr)</Label><Input type="number" value={laborRate} onChange={(e) => setLaborRate(parseFloat(e.target.value))} /></div>
              <div><Label>Labor Hours</Label><Input type="number" value={laborHours} onChange={(e) => setLaborHours(parseFloat(e.target.value))} /></div>
              <div><Label>Supervision Rate ($/hr)</Label><Input type="number" value={supervisionRate} onChange={(e) => setSupervisionRate(parseFloat(e.target.value))} /></div>
              <div><Label>Supervision Hours</Label><Input type="number" value={supervisionHours} onChange={(e) => setSupervisionHours(parseFloat(e.target.value))} /></div>
              <div><Label>Per Diem Rate ($/day)</Label><Input type="number" value={perDiemRate} onChange={(e) => setPerDiemRate(parseFloat(e.target.value))} /></div>
              <div><Label>Per Diem Days</Label><Input type="number" value={perDiemDays} onChange={(e) => setPerDiemDays(parseFloat(e.target.value))} /></div>
            </div>
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <div className="flex justify-between"><span>Base Labor:</span><span className="font-semibold">${laborCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Supervision:</span><span className="font-semibold">${supervisionCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Per Diem:</span><span className="font-semibold">${perDiemCost.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total Labor:</span><span>${(laborCost + supervisionCost + perDiemCost).toFixed(2)}</span></div>
            </div>
          </TabsContent>

          <TabsContent value="costs" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Equipment Daily Rate ($)</Label><Input type="number" value={equipmentDaily} onChange={(e) => setEquipmentDaily(parseFloat(e.target.value))} /></div>
              <div><Label>Equipment Days</Label><Input type="number" value={equipmentDays} onChange={(e) => setEquipmentDays(parseFloat(e.target.value))} /></div>
              <div><Label>Insurance & Bonds ($)</Label><Input type="number" value={insuranceBond} onChange={(e) => setInsuranceBond(parseFloat(e.target.value))} /></div>
              <div><Label>Permits & Fees ($)</Label><Input type="number" value={permits} onChange={(e) => setPermits(parseFloat(e.target.value))} /></div>
              <div><Label>Mobilization ($)</Label><Input type="number" value={mobilization} onChange={(e) => setMobilization(parseFloat(e.target.value))} /></div>
              <div><Label>Overhead (%)</Label><Input type="number" value={overheadPercent} onChange={(e) => setOverheadPercent(parseFloat(e.target.value))} /></div>
              <div><Label>Profit Margin (%)</Label><Input type="number" value={profitPercent} onChange={(e) => setProfitPercent(parseFloat(e.target.value))} /></div>
              <div><Label>Tax Rate (%)</Label><Input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value))} /></div>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between"><span>Materials:</span><span className="font-semibold">${materialsSubtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Labor (Base + Supervision + Per Diem):</span><span className="font-semibold">${(laborCost + supervisionCost + perDiemCost).toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Equipment:</span><span className="font-semibold">${equipmentCost.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Insurance & Bonds:</span><span className="font-semibold">${insuranceBond.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Permits & Fees:</span><span className="font-semibold">${permits.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Mobilization:</span><span className="font-semibold">${mobilization.toFixed(2)}</span></div>
              <div className="flex justify-between border-t pt-2"><span>Direct Costs:</span><span className="font-semibold">${directCosts.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Overhead ({overheadPercent}%):</span><span className="font-semibold">${overhead.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Profit ({profitPercent}%):</span><span className="font-semibold">${profit.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax ({taxRate}%):</span><span className="font-semibold">${taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-xl font-bold border-t-2 pt-3 text-primary"><span>Grand Total:</span><span>${grandTotal.toFixed(2)}</span></div>
            </div>
            <Button onClick={handleSave} className="w-full" size="lg">
              <Save className="mr-2 h-4 w-4" />
              Save Enhanced Estimate
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
