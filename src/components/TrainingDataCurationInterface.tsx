import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertCircle, Filter, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import TrainingDataReviewCard from './TrainingDataReviewCard';
import AddTrainingExampleModal from './AddTrainingExampleModal';
import BatchActionsBar from './BatchActionsBar';
import QualityFilterPanel from './QualityFilterPanel';

export default function TrainingDataCurationInterface() {
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    minQuality: 0,
    maxQuality: 1,
    excludeDuplicates: false,
    excludeOutliers: false,
    documentType: 'all',
    difficulty: 'all'
  });

  useEffect(() => {
    loadTrainingData();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [trainingData, filters]);

  const loadTrainingData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('training_data_curation')
        .select('*')
        .eq('status', activeTab)
        .order('quality_score', { ascending: false });

      if (error) throw error;
      setTrainingData(data || []);
    } catch (error: any) {
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trainingData];

    filtered = filtered.filter(item => 
      item.quality_score >= filters.minQuality && 
      item.quality_score <= filters.maxQuality
    );

    if (filters.excludeDuplicates) {
      filtered = filtered.filter(item => !item.is_duplicate);
    }

    if (filters.excludeOutliers) {
      filtered = filtered.filter(item => !item.is_outlier);
    }

    if (filters.documentType !== 'all') {
      filtered = filtered.filter(item => item.document_type === filters.documentType);
    }

    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(item => item.difficulty_level === filters.difficulty);
    }

    setFilteredData(filtered);
  };

  const handleBatchApprove = async () => {
    try {
      const updates = Array.from(selectedItems).map(id =>
        supabase
          .from('training_data_curation')
          .update({ status: 'approved', reviewed_at: new Date().toISOString() })
          .eq('id', id)
      );

      await Promise.all(updates);
      toast.success(`Approved ${selectedItems.size} items`);
      setSelectedItems(new Set());
      loadTrainingData();
    } catch (error) {
      toast.error('Failed to approve items');
    }
  };

  const handleBatchReject = async () => {
    try {
      const updates = Array.from(selectedItems).map(id =>
        supabase
          .from('training_data_curation')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
          .eq('id', id)
      );

      await Promise.all(updates);
      toast.success(`Rejected ${selectedItems.size} items`);
      setSelectedItems(new Set());
      loadTrainingData();
    } catch (error) {
      toast.error('Failed to reject items');
    }
  };

  const stats = {
    pending: trainingData.filter(d => d.status === 'pending').length,
    approved: trainingData.filter(d => d.status === 'approved').length,
    rejected: trainingData.filter(d => d.status === 'rejected').length,
    avgQuality: trainingData.length > 0 
      ? (trainingData.reduce((sum, d) => sum + d.quality_score, 0) / trainingData.length).toFixed(2)
      : '0.00'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Training Data Curation</h2>
          <p className="text-muted-foreground">Review and approve extraction feedback for fine-tuning</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          Add Training Example
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending Review</div>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Approved</div>
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Avg Quality</div>
          <div className="text-2xl font-bold">{stats.avgQuality}</div>
        </Card>
      </div>

      <div className="flex gap-4">
        <QualityFilterPanel filters={filters} onFiltersChange={setFilters} />
        
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {selectedItems.size > 0 && (
                <BatchActionsBar
                  selectedCount={selectedItems.size}
                  onApprove={handleBatchApprove}
                  onReject={handleBatchReject}
                  onClear={() => setSelectedItems(new Set())}
                />
              )}

              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : filteredData.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No training data to review</p>
                </Card>
              ) : (
                filteredData.map(item => (
                  <TrainingDataReviewCard
                    key={item.id}
                    data={item}
                    selected={selectedItems.has(item.id)}
                    onSelect={(selected) => {
                      const newSet = new Set(selectedItems);
                      if (selected) newSet.add(item.id);
                      else newSet.delete(item.id);
                      setSelectedItems(newSet);
                    }}
                    onUpdate={loadTrainingData}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showAddModal && (
        <AddTrainingExampleModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadTrainingData}
        />
      )}
    </div>
  );
}