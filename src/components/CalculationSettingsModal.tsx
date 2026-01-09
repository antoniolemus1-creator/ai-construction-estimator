import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface CalculationSettings {
  metalFraming: {
    baseRate: number;
    gaugeMultipliers: { [key: string]: number };
    coatingMultipliers: { [key: string]: number };
    locationMultipliers: { interior: number; exterior: number };
  };
  drywall: {
    baseRate: number;
    thicknessMultipliers: { [key: string]: number };
    typeMultipliers: { [key: string]: number };
    ceilingMultipliers: { accessible: number; notAccessible: number };
  };
  woodFraming: {
    baseRate: number;
    woodTypeMultipliers: { [key: string]: number };
    platesMultiplier: number;
  };
  ceiling: {
    typeRates: { [key: string]: number };
  };
  labor: {
    laborRate: number;
  };
}

const defaultSettings: CalculationSettings = {
  metalFraming: {
    baseRate: 0.8,
    gaugeMultipliers: { '25': 1, '20': 1.15, '18': 1.3, '16': 1.5, '14': 1.7, '12': 2 },
    coatingMultipliers: { 'G40': 0.95, 'G60': 1, 'G90': 1.15, 'Galvanized': 1.1, 'Bare': 0.85 },
    locationMultipliers: { interior: 1, exterior: 1.5 }
  },
  drywall: {
    baseRate: 2.5,
    thicknessMultipliers: { '1/2': 1, '5/8': 1.15, '3/4': 1.3, '1': 1.5 },
    typeMultipliers: { 'standard': 1, 'moisture': 1.2, 'typeX': 1.3, 'typeC': 1.4, 'bulletproof': 3 },
    ceilingMultipliers: { accessible: 1, notAccessible: 1.5 }
  },
  woodFraming: {
    baseRate: 1.2,
    woodTypeMultipliers: { 'standard': 1, 'firerated': 1.4, 'pressure': 1.3 },
    platesMultiplier: 0.15
  },
  ceiling: {
    typeRates: { 'actHigh': 6, 'actLow': 3.5, 'metalFramed': 5, 'woodFramed': 4.5, 'drywallGrid': 4, 'specialty': 8 }
  },
  labor: { laborRate: 0.45 }
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CalculationSettingsModal({ open, onOpenChange }: Props) {
  const [localSettings, setLocalSettings] = useState<CalculationSettings>(defaultSettings);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('calculationSettings');
    if (stored) {
      setLocalSettings(JSON.parse(stored));
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('calculationSettings', JSON.stringify(localSettings));
    toast({ title: 'Settings Saved', description: 'Calculation settings updated successfully' });
    onOpenChange(false);
  };


  const resetDefaults = () => {
    setLocalSettings(defaultSettings);
    toast({ title: 'Reset to Defaults', description: 'All settings reset to default values' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculation Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="metalFraming">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metalFraming">Metal</TabsTrigger>
            <TabsTrigger value="drywall">Drywall</TabsTrigger>
            <TabsTrigger value="woodFraming">Wood</TabsTrigger>
            <TabsTrigger value="ceiling">Ceiling</TabsTrigger>
            <TabsTrigger value="labor">Labor</TabsTrigger>
          </TabsList>
          <TabsContent value="metalFraming" className="space-y-4">
            <div><Label>Base Rate ($/LF/ft)</Label><Input type="number" step="0.1" value={localSettings.metalFraming.baseRate} onChange={(e) => setLocalSettings({...localSettings, metalFraming: {...localSettings.metalFraming, baseRate: parseFloat(e.target.value)}})} /></div>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(localSettings.metalFraming.gaugeMultipliers).map(k => (
                <div key={k}><Label>Gauge {k} Multiplier</Label><Input type="number" step="0.01" value={localSettings.metalFraming.gaugeMultipliers[k]} onChange={(e) => setLocalSettings({...localSettings, metalFraming: {...localSettings.metalFraming, gaugeMultipliers: {...localSettings.metalFraming.gaugeMultipliers, [k]: parseFloat(e.target.value)}}})} /></div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="drywall" className="space-y-4">
            <div><Label>Base Rate ($/SF)</Label><Input type="number" step="0.1" value={localSettings.drywall.baseRate} onChange={(e) => setLocalSettings({...localSettings, drywall: {...localSettings.drywall, baseRate: parseFloat(e.target.value)}})} /></div>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(localSettings.drywall.thicknessMultipliers).map(k => (
                <div key={k}><Label>{k}" Multiplier</Label><Input type="number" step="0.01" value={localSettings.drywall.thicknessMultipliers[k]} onChange={(e) => setLocalSettings({...localSettings, drywall: {...localSettings.drywall, thicknessMultipliers: {...localSettings.drywall.thicknessMultipliers, [k]: parseFloat(e.target.value)}}})} /></div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="woodFraming" className="space-y-4">
            <div><Label>Base Rate ($/LF/ft)</Label><Input type="number" step="0.1" value={localSettings.woodFraming.baseRate} onChange={(e) => setLocalSettings({...localSettings, woodFraming: {...localSettings.woodFraming, baseRate: parseFloat(e.target.value)}})} /></div>
          </TabsContent>
          <TabsContent value="ceiling" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(localSettings.ceiling.typeRates).map(k => (
                <div key={k}><Label>{k} Rate ($/SF)</Label><Input type="number" step="0.1" value={localSettings.ceiling.typeRates[k]} onChange={(e) => setLocalSettings({...localSettings, ceiling: {...localSettings.ceiling, typeRates: {...localSettings.ceiling.typeRates, [k]: parseFloat(e.target.value)}}})} /></div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="labor" className="space-y-4">
            <div><Label>Labor Rate (% of materials)</Label><Input type="number" step="0.01" value={localSettings.labor.laborRate} onChange={(e) => setLocalSettings({...localSettings, labor: {...localSettings.labor, laborRate: parseFloat(e.target.value)}})} /></div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={resetDefaults}>Reset to Defaults</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}