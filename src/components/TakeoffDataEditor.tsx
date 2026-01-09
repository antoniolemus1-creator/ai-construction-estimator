import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { Pencil, Trash2, Plus, Save, X, Ruler, Square, DoorOpen, Grid3x3 } from 'lucide-react';
import { toast } from 'sonner';
import { BulkActionsToolbar } from './BulkActionsToolbar';

interface TakeoffDataEditorProps {
  planId: string;
}

interface TakeoffItem {
  id?: string;
  plan_id: string;
  item_type: string;
  description: string;
  quantity: number;
  unit: string;
  confidence_score: number;
  page_number?: number;
}

export function TakeoffDataEditor({ planId }: TakeoffDataEditorProps) {
  const [items, setItems] = useState<TakeoffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [editForm, setEditForm] = useState<Partial<TakeoffItem>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [planId]);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('takeoff_data')
      .select('*')
      .eq('plan_id', planId)
      .order('item_type', { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  const startEdit = (item: TakeoffItem) => {
    setEditingId(item.id!);
    setEditForm(item);
    setAddingNew(false);
  };

  const startAdd = () => {
    setAddingNew(true);
    setEditingId(null);
    setEditForm({
      plan_id: planId,
      item_type: 'wall',
      description: '',
      quantity: 0,
      unit: 'LF',
      confidence_score: 1.0,
      page_number: 1
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingNew(false);
    setEditForm({});
  };

  const saveItem = async () => {
    if (!editForm.description || !editForm.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (addingNew) {
      const { error } = await supabase.from('takeoff_data').insert([editForm]);
      if (error) {
        toast.error('Failed to add item');
        return;
      }
      toast.success('Item added successfully');
    } else {
      const { error } = await supabase
        .from('takeoff_data')
        .update(editForm)
        .eq('id', editingId!);
      if (error) {
        toast.error('Failed to update item');
        return;
      }
      toast.success('Item updated successfully');
    }

    cancelEdit();
    loadData();
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const { error } = await supabase.from('takeoff_data').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete item');
      return;
    }
    toast.success('Item deleted successfully');
    loadData();
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id!));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} items?`)) return;
    
    const { error } = await supabase.from('takeoff_data').delete().in('id', selectedIds);
    if (error) {
      toast.error('Failed to delete items');
      return;
    }
    toast.success(`${selectedIds.length} items deleted`);
    setSelectedIds([]);
    loadData();
  };

  const handleBulkUpdateUnit = async (unit: string) => {
    const { error } = await supabase.from('takeoff_data').update({ unit }).in('id', selectedIds);
    if (error) {
      toast.error('Failed to update units');
      return;
    }
    toast.success(`Updated ${selectedIds.length} items`);
    setSelectedIds([]);
    loadData();
  };

  const handleBulkAdjustConfidence = async (percentage: number) => {
    const selectedItems = items.filter(item => selectedIds.includes(item.id!));
    const updates = selectedItems.map(item => {
      const adjustment = percentage / 100;
      let newScore = item.confidence_score + adjustment;
      newScore = Math.max(0, Math.min(1, newScore));
      return supabase.from('takeoff_data').update({ confidence_score: newScore }).eq('id', item.id!);
    });
    
    await Promise.all(updates);
    toast.success(`Adjusted confidence for ${selectedIds.length} items`);
    setSelectedIds([]);
    loadData();
  };

  const handleBulkApplyMarkup = async (percentage: number) => {
    const selectedItems = items.filter(item => selectedIds.includes(item.id!));
    const updates = selectedItems.map(item => {
      const newQuantity = item.quantity * (1 + percentage / 100);
      return supabase.from('takeoff_data').update({ quantity: newQuantity }).eq('id', item.id!);
    });
    
    await Promise.all(updates);
    toast.success(`Applied ${percentage}% markup to ${selectedIds.length} items`);
    setSelectedIds([]);
    loadData();
  };

  const handleBulkChangeType = async (type: string) => {
    const { error } = await supabase.from('takeoff_data').update({ item_type: type }).in('id', selectedIds);
    if (error) {
      toast.error('Failed to change item types');
      return;
    }
    toast.success(`Changed type for ${selectedIds.length} items`);
    setSelectedIds([]);
    loadData();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'wall': return <Ruler className="w-4 h-4" />;
      case 'ceiling': return <Square className="w-4 h-4" />;
      case 'door': return <DoorOpen className="w-4 h-4" />;
      case 'window': return <Grid3x3 className="w-4 h-4" />;
      default: return null;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };


  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Takeoff Data Editor</h3>
        <Button onClick={startAdd} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === items.length && items.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Page</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {addingNew && (
              <TableRow className="bg-blue-50">
                <TableCell />
                <TableCell>
                  <select
                    className="border rounded px-2 py-1"
                    value={editForm.item_type}
                    onChange={(e) => setEditForm({ ...editForm, item_type: e.target.value })}
                  >
                    <option value="wall">Wall</option>
                    <option value="ceiling">Ceiling</option>
                    <option value="door">Door</option>
                    <option value="window">Window</option>
                    <option value="other">Other</option>
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-16"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={editForm.confidence_score}
                    onChange={(e) => setEditForm({ ...editForm, confidence_score: parseFloat(e.target.value) })}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={editForm.page_number}
                    onChange={(e) => setEditForm({ ...editForm, page_number: parseInt(e.target.value) })}
                    className="w-16"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={saveItem} className="mr-2">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              editingId === item.id ? (
                <TableRow key={item.id} className="bg-yellow-50">
                  <TableCell />
                  <TableCell>
                    <select
                      className="border rounded px-2 py-1"
                      value={editForm.item_type}
                      onChange={(e) => setEditForm({ ...editForm, item_type: e.target.value })}
                    >
                      <option value="wall">Wall</option>
                      <option value="ceiling">Ceiling</option>
                      <option value="door">Door</option>
                      <option value="window">Window</option>
                      <option value="other">Other</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editForm.quantity}
                      onChange={(e) => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={editForm.confidence_score}
                      onChange={(e) => setEditForm({ ...editForm, confidence_score: parseFloat(e.target.value) })}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={editForm.page_number}
                      onChange={(e) => setEditForm({ ...editForm, page_number: parseInt(e.target.value) })}
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={saveItem} className="mr-2">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(item.id!)}
                      onCheckedChange={() => toggleSelect(item.id!)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIcon(item.item_type)}
                      <span className="capitalize">{item.item_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="font-mono">{item.quantity?.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                  <TableCell>
                    <Badge className={getConfidenceColor(item.confidence_score)}>
                      {(item.confidence_score * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{item.page_number || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(item)} className="mr-2">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteItem(item.id!)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </div>

      {items.length === 0 && !addingNew && (
        <div className="text-center py-8 text-muted-foreground">
          No takeoff data yet. Add items manually or run AI Vision extraction.
        </div>
      )}

      {selectedIds.length > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onBulkDelete={handleBulkDelete}
          onBulkUpdateUnit={handleBulkUpdateUnit}
          onBulkAdjustConfidence={handleBulkAdjustConfidence}
          onBulkApplyMarkup={handleBulkApplyMarkup}
          onBulkChangeType={handleBulkChangeType}
          onClearSelection={() => setSelectedIds([])}
        />
      )}
    </Card>
  );
}
