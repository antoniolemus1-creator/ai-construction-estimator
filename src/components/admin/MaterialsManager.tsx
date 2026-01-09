import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Edit, Trash2, Download, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { AddMaterialWizard } from './AddMaterialWizard';
import { BulkEditMaterialsModal } from './BulkEditMaterialsModal';
import { AddMaterialFromTemplateModal } from './AddMaterialFromTemplateModal';




interface Material {
  id: string;
  material_name: string;
  material_code?: string;
  material_category: string;
  brand_name: string;
  manufacturer: string;
  naics_code: string;
  unit_of_measure: string;
  price_per_unit: number;
  uom_cost?: number;
  waste_percentage?: number;
  cost_code?: string;
  section?: string;
  is_specialty: boolean;
  is_active: boolean;
}


export function MaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showWizard, setShowWizard] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);



  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('construction_materials')
        .select('*')
        .order('material_name');

      if (error) throw error;
      setMaterials(data || []);
    } catch (error: any) {
      toast.error('Failed to load materials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Material Code', 'Material Name', 'Category', 'Brand', 'Manufacturer', 'NAICS', 'Unit', 'Price', 'Waste %', 'Cost Code', 'Section', 'Status'];
    const rows = materials.map(m => [
      m.material_code || '',
      m.material_name,
      m.material_category,
      m.brand_name,
      m.manufacturer,
      m.naics_code,
      m.unit_of_measure,
      m.price_per_unit,
      m.waste_percentage || 0,
      m.cost_code || '',
      m.section || '',
      m.is_active ? 'Active' : 'Inactive'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materials_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Materials exported to CSV');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredMaterials.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMaterials.map(m => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         m.brand_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.material_category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'lumber', 'metal_framing', 'drywall', 'act_ceiling', 'insulation'];


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Materials Database</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplateModal(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Add from Template
              </Button>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            </div>
          </CardTitle>

        </CardHeader>
        <CardContent>
          {selectedIds.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.length} materials selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setShowBulkEdit(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Bulk Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>



          <div className="border rounded-lg overflow-hidden overflow-x-auto">

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredMaterials.length && filteredMaterials.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost Code</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Waste %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(material.id)}
                        onCheckedChange={() => toggleSelect(material.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{material.material_code || '-'}</TableCell>
                    <TableCell className="font-medium">{material.material_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{material.material_category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{material.cost_code || '-'}</TableCell>
                    <TableCell>${material.price_per_unit}/{material.unit_of_measure}</TableCell>
                    <TableCell>{material.waste_percentage || 0}%</TableCell>
                    <TableCell>
                      <Badge variant={material.is_active ? 'default' : 'secondary'}>
                        {material.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        </CardContent>
      </Card>

      <AddMaterialWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={loadMaterials}
      />

      <BulkEditMaterialsModal
        open={showBulkEdit}
        onClose={() => {
          setShowBulkEdit(false);
          setSelectedIds([]);
        }}
        selectedIds={selectedIds}
        onSuccess={() => {
          loadMaterials();
          setSelectedIds([]);
        }}
      />

      {showTemplateModal && (
        <AddMaterialFromTemplateModal
          onClose={() => setShowTemplateModal(false)}
          onSuccess={() => {
            setShowTemplateModal(false);
            loadMaterials();
          }}
        />
      )}

    </>
  );
}

