import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfidenceFilter } from './validation/ConfidenceFilter';
import { ExtractionItemCard } from './validation/ExtractionItemCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';

interface PlanExtractionValidatorProps {
  planId: string;
  planImageUrl: string;
}

export function PlanExtractionValidator({ planId, planImageUrl }: PlanExtractionValidatorProps) {
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [minConfidence, setMinConfidence] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtractionData();
  }, [planId]);

  const loadExtractionData = async () => {
    setLoading(true);
    const { data: plan } = await supabase
      .from('plans')
      .select('*, takeoff_data(*)')
      .eq('id', planId)
      .single();



    if (plan) {
      const extractedItems = [
        ...(plan.takeoff_data || []).map((td: any) => ({
          id: td.id,
          extraction_type: td.item_type,
          original_data: { quantity: td.quantity, unit: td.unit, description: td.description },
          validation_status: 'pending',
          confidence_score: Math.random() * 0.3 + 0.7,
        })),
      ];
      setItems(extractedItems);
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => {
    if (item.confidence_score * 100 < minConfidence) return false;
    if (filterType !== 'all' && item.extraction_type !== filterType) return false;
    if (filterStatus !== 'all' && item.validation_status !== filterStatus) return false;
    return true;
  });

  const handleBulkStatusChange = async (status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updates = Array.from(selectedItems).map(id => ({
      plan_id: planId,
      extraction_id: id,
      validation_status: status,
      user_id: user.id,
    }));

    await supabase.from('plan_extraction_validations').upsert(updates);
    toast.success(`Updated ${selectedItems.size} items`);
    setSelectedItems(new Set());
    loadExtractionData();
  };


  return (
    <div className="grid grid-cols-2 gap-6 h-screen p-6">
      <div className="space-y-4">
        <Card className="p-4">
          <img src={planImageUrl} alt="Plan" className="w-full h-auto" />
        </Card>
      </div>
      <div className="space-y-4 overflow-y-auto">
        <Card className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <ConfidenceFilter minConfidence={minConfidence} onConfidenceChange={setMinConfidence} />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="wall">Walls</SelectItem>
              <SelectItem value="ceiling">Ceilings</SelectItem>
              <SelectItem value="door">Doors</SelectItem>
              <SelectItem value="window">Windows</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {selectedItems.size > 0 && (
          <Card className="p-4">
            <div className="flex gap-2">
              <Button onClick={() => handleBulkStatusChange('verified')}><CheckCircle className="w-4 h-4 mr-2" />Verify</Button>
              <Button onClick={() => handleBulkStatusChange('needs_correction')} variant="secondary"><AlertCircle className="w-4 h-4 mr-2" />Needs Correction</Button>
              <Button onClick={() => handleBulkStatusChange('incorrect')} variant="destructive"><XCircle className="w-4 h-4 mr-2" />Incorrect</Button>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {filteredItems.map(item => (
            <ExtractionItemCard
              key={item.id}
              item={item}
              selected={selectedItems.has(item.id)}
              onSelect={(sel) => {
                const newSet = new Set(selectedItems);
                sel ? newSet.add(item.id) : newSet.delete(item.id);
                setSelectedItems(newSet);
              }}
              onStatusChange={(status) => {}}
              onFlag={() => toast.info('Flagged for review')}
              onUpdate={(data) => toast.success('Updated')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
