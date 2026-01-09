import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CSVColumnMapper } from './CSVColumnMapper';
import { CSVPreviewTable } from './CSVPreviewTable';
import { MappingProfileManager } from './MappingProfileManager';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface CSVMappingWizardProps {
  open: boolean;
  onClose: () => void;
  csvContent: string;
  onComplete: (mappedData: any[]) => void;
}

const SYSTEM_FIELDS = [
  { key: 'name', label: 'Material Name', required: true },
  { key: 'quantity', label: 'Quantity', required: true },
  { key: 'unit', label: 'Unit', required: true },
  { key: 'material_code', label: 'Material Code', required: false },
  { key: 'brand', label: 'Brand', required: false },
  { key: 'manufacturer', label: 'Manufacturer', required: false },
  { key: 'cost_code', label: 'Cost Code', required: false },
  { key: 'waste_percentage', label: 'Waste %', required: false },
  { key: 'price_per_unit', label: 'Price Per Unit', required: false },
];

export function CSVMappingWizard({ open, onClose, csvContent, onComplete }: CSVMappingWizardProps) {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (csvContent) {
      const lines = csvContent.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        setCsvHeaders(headers);
        
        const rows = lines.slice(1, 6).map(line => line.split(',').map(c => c.trim()));
        setPreviewRows(rows);
        
        // Auto-detect mappings
        const detected = autoDetectMappings(headers);
        setMappings(detected);
      }
    }
  }, [csvContent]);

  const autoDetectMappings = (headers: string[]): Record<string, string> => {
    const mappings: Record<string, string> = {};
    const lowerHeaders = headers.map(h => h.toLowerCase());
    
    SYSTEM_FIELDS.forEach(field => {
      const variations = getFieldVariations(field.key);
      for (const variation of variations) {
        const idx = lowerHeaders.findIndex(h => h.includes(variation));
        if (idx >= 0) {
          mappings[field.key] = headers[idx];
          break;
        }
      }
    });
    
    return mappings;
  };

  const getFieldVariations = (fieldKey: string): string[] => {
    const variations: Record<string, string[]> = {
      name: ['name', 'material', 'item', 'description', 'product'],
      quantity: ['quantity', 'qty', 'amount', 'count'],
      unit: ['unit', 'uom', 'measure'],
      material_code: ['code', 'sku', 'item code', 'material code'],
      brand: ['brand', 'make'],
      manufacturer: ['manufacturer', 'mfr', 'vendor'],
      cost_code: ['cost code', 'costcode', 'wbs'],
      waste_percentage: ['waste', 'waste%', 'waste factor'],
      price_per_unit: ['price', 'unit price', 'cost', 'rate'],
    };
    return variations[fieldKey] || [fieldKey];
  };

  const handleMappingChange = (systemField: string, csvColumn: string) => {
    setMappings(prev => ({
      ...prev,
      [systemField]: csvColumn === '__none__' ? '' : csvColumn
    }));
    setValidationError('');
  };

  const validateMappings = (): boolean => {
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
    const missing = requiredFields.filter(f => !mappings[f.key]);
    
    if (missing.length > 0) {
      setValidationError(`Required fields not mapped: ${missing.map(f => f.label).join(', ')}`);
      return false;
    }
    return true;
  };

  const handleComplete = () => {
    if (!validateMappings()) return;
    
    const lines = csvContent.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const mappedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      Object.entries(mappings).forEach(([sysField, csvCol]) => {
        if (csvCol) {
          const idx = headers.indexOf(csvCol);
          if (idx >= 0) {
            row[sysField] = values[idx];
          }
        }
      });
      
      if (row.name) mappedData.push(row);
    }
    
    onComplete(mappedData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CSV Column Mapping Wizard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              We've auto-detected your column mappings. Review and adjust as needed.
            </AlertDescription>
          </Alert>

          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <CSVPreviewTable headers={csvHeaders} rows={previewRows} />
          
          <CSVColumnMapper
            csvHeaders={csvHeaders}
            systemFields={SYSTEM_FIELDS}
            mappings={mappings}
            onMappingChange={handleMappingChange}
          />

          <MappingProfileManager
            currentMappings={mappings}
            onLoadProfile={setMappings}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleComplete}>Import Materials</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
