import { useState, useEffect } from 'react';
import { Save, Upload, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Estimate {
  id: string;
  projectName: string;
  location: string;
  squareFootage: number;
  estimatedCost: number;
  notes: string;
  timestamp: Date;
  synced: boolean;
}

export function OfflineEstimateForm() {
  const [online, setOnline] = useState(navigator.onLine);
  const [estimate, setEstimate] = useState<Partial<Estimate>>({});
  const [saved, setSaved] = useState<Estimate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const stored = localStorage.getItem('offline-estimates');
    if (stored) setSaved(JSON.parse(stored));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveEstimate = () => {
    const newEstimate: Estimate = {
      id: Date.now().toString(),
      projectName: estimate.projectName || '',
      location: estimate.location || '',
      squareFootage: estimate.squareFootage || 0,
      estimatedCost: estimate.estimatedCost || 0,
      notes: estimate.notes || '',
      timestamp: new Date(),
      synced: false
    };

    const updated = [...saved, newEstimate];
    setSaved(updated);
    localStorage.setItem('offline-estimates', JSON.stringify(updated));
    
    // Also store in 'estimates' key for Procore sync compatibility
    const estimates = JSON.parse(localStorage.getItem('estimates') || '[]');
    localStorage.setItem('estimates', JSON.stringify([...estimates, {
      description: newEstimate.projectName,
      totalCost: newEstimate.estimatedCost,
      notes: newEstimate.notes,
      costCode: 'FIELD-EST',
      timestamp: newEstimate.timestamp
    }]));
    
    setEstimate({});
    toast({ title: 'Estimate saved locally' });
  };


  const syncEstimates = async () => {
    const unsynced = saved.filter(e => !e.synced);
    // Simulate sync
    toast({ title: 'Syncing...', description: `${unsynced.length} estimates` });
    setTimeout(() => {
      const synced = saved.map(e => ({ ...e, synced: true }));
      setSaved(synced);
      localStorage.setItem('offline-estimates', JSON.stringify(synced));
      toast({ title: 'Sync complete' });
    }, 1000);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Quick Estimate</h3>
        <div className="flex items-center gap-2 text-sm">
          {online ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
          {online ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Project Name</Label>
          <Input value={estimate.projectName || ''} onChange={e => setEstimate({...estimate, projectName: e.target.value})} />
        </div>
        <div>
          <Label>Location</Label>
          <Input value={estimate.location || ''} onChange={e => setEstimate({...estimate, location: e.target.value})} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Sq Ft</Label>
            <Input type="number" value={estimate.squareFootage || ''} onChange={e => setEstimate({...estimate, squareFootage: +e.target.value})} />
          </div>
          <div>
            <Label>Cost ($)</Label>
            <Input type="number" value={estimate.estimatedCost || ''} onChange={e => setEstimate({...estimate, estimatedCost: +e.target.value})} />
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={estimate.notes || ''} onChange={e => setEstimate({...estimate, notes: e.target.value})} rows={3} />
        </div>
        
        <div className="flex gap-2">
          <Button onClick={saveEstimate} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          {online && saved.some(e => !e.synced) && (
            <Button onClick={syncEstimates} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Sync
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
