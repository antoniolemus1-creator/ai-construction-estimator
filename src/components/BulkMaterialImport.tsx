import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Loader2, Download, AlertCircle, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CSVMappingWizard } from './CSVMappingWizard';


interface Material {
  name: string;
  quantity: number;
  unit: string;
  material_code?: string;
  brand?: string;
  manufacturer?: string;
  cost_code?: string;
  waste_percentage?: number;
  price_per_unit?: number;
  unitPrice?: number;
  totalPrice?: number;
  error?: string;
}

interface BulkMaterialImportProps {
  onImportComplete: (materials: Material[], projectName: string, state?: string, county?: string) => void;
}

export default function BulkMaterialImport({ onImportComplete }: BulkMaterialImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [state, setState] = useState('');
  const [county, setCounty] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const { toast } = useToast();


  const handleDownloadTemplate = () => {
    const headers = [
      'name',
      'quantity',
      'unit',
      'material_code',
      'brand',
      'manufacturer',
      'cost_code',
      'waste_percentage',
      'price_per_unit'
    ];
    const exampleRows = [
      ['2x4x8 Lumber', '100', 'EA', 'LUM-2X4-8', 'Generic', 'Lumber Co', '06100', '10', '5.50'],
      ['1/2" Drywall 4x8', '50', 'SHEET', 'DRY-12-4X8', 'USG', 'USG Corp', '09250', '15', '12.00'],
      ['Metal Stud 3-5/8" 20GA', '200', 'EA', 'MET-358-20', 'ClarkDietrich', 'Clark Western', '05400', '5', '3.25'],
      ['Joint Compound', '10', 'PAIL', 'DRY-COMP-5G', 'Sheetrock', 'USG Corp', '09250', '8', '18.50'],
      ['Drywall Screws 1-1/4"', '5', 'BOX', 'FAS-SCR-114', 'Grip-Rite', 'PrimeSource', '05050', '2', '12.75'],
      ['Insulation R-13 Batt', '75', 'ROLL', 'INS-R13-16', 'Owens Corning', 'Owens Corning', '07210', '5', '28.00']
    ];

    const csvContent = [headers, ...exampleRows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: 'Template downloaded successfully' });
  };

  const validateNumber = (value: string, fieldName: string, rowNum: number): number | null => {
    if (!value || value.trim() === '') return null;
    const num = parseFloat(value);
    if (isNaN(num)) {
      return null;
    }
    if (num < 0) {
      return null;
    }
    return num;
  };

  const parseCSV = (text: string): { materials: Material[], errors: string[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { materials: [], errors: ['CSV file is empty or has no data rows'] };
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const errors: string[] = [];
    const materials: Material[] = [];

    // Validate required headers
    const requiredHeaders = ['name', 'quantity', 'unit'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h) && !headers.includes(h.replace('_', '')));
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return { materials: [], errors };
    }

    for (let i = 1; i < lines.length; i++) {
      const rowNum = i + 1;
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length === 0 || values.every(v => !v)) continue;

      const nameIdx = headers.indexOf('name');
      const quantityIdx = headers.indexOf('quantity');
      const unitIdx = headers.indexOf('unit');
      const materialCodeIdx = headers.indexOf('material_code');
      const brandIdx = headers.indexOf('brand');
      const manufacturerIdx = headers.indexOf('manufacturer');
      const costCodeIdx = headers.indexOf('cost_code');
      const wasteIdx = headers.indexOf('waste_percentage');
      const priceIdx = headers.indexOf('price_per_unit');

      const name = values[nameIdx] || '';
      if (!name) {
        errors.push(`Row ${rowNum}: Material name is required`);
        continue;
      }

      const quantity = validateNumber(values[quantityIdx], 'quantity', rowNum);
      if (quantity === null || quantity <= 0) {
        errors.push(`Row ${rowNum} (${name}): Invalid quantity - must be a positive number`);
        continue;
      }

      const unit = values[unitIdx] || 'EA';
      
      const material: Material = {
        name,
        quantity,
        unit
      };

      // Optional fields
      if (materialCodeIdx >= 0 && values[materialCodeIdx]) {
        material.material_code = values[materialCodeIdx];
      }
      if (brandIdx >= 0 && values[brandIdx]) {
        material.brand = values[brandIdx];
      }
      if (manufacturerIdx >= 0 && values[manufacturerIdx]) {
        material.manufacturer = values[manufacturerIdx];
      }
      if (costCodeIdx >= 0 && values[costCodeIdx]) {
        material.cost_code = values[costCodeIdx];
      }

      // Validate waste_percentage
      if (wasteIdx >= 0 && values[wasteIdx]) {
        const waste = validateNumber(values[wasteIdx], 'waste_percentage', rowNum);
        if (waste !== null) {
          if (waste > 100) {
            errors.push(`Row ${rowNum} (${name}): Waste percentage cannot exceed 100%`);
          } else {
            material.waste_percentage = waste;
          }
        } else if (values[wasteIdx].trim() !== '') {
          errors.push(`Row ${rowNum} (${name}): Invalid waste_percentage - must be a number`);
        }
      }

      // Validate price_per_unit
      if (priceIdx >= 0 && values[priceIdx]) {
        const price = validateNumber(values[priceIdx], 'price_per_unit', rowNum);
        if (price !== null) {
          material.price_per_unit = price;
          material.unitPrice = price;
        } else if (values[priceIdx].trim() !== '') {
          errors.push(`Row ${rowNum} (${name}): Invalid price_per_unit - must be a number`);
        }
      }

      materials.push(material);
    }

    return { materials, errors };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setErrors([]);
    }
  };

  const handleSmartImport = async () => {
    if (!file || !projectName) {
      toast({ title: 'Error', description: 'Please provide project name and CSV file', variant: 'destructive' });
      return;
    }

    const text = await file.text();
    setCsvContent(text);
    setShowWizard(true);
  };

  const handleWizardComplete = (mappedData: any[]) => {
    setLoading(true);
    setErrors([]);
    
    try {
      const materials: Material[] = [];
      const errors: string[] = [];

      mappedData.forEach((row, idx) => {
        const rowNum = idx + 2;
        const name = row.name?.trim();
        if (!name) {
          errors.push(`Row ${rowNum}: Material name is required`);
          return;
        }

        const quantity = validateNumber(row.quantity, 'quantity', rowNum);
        if (quantity === null || quantity <= 0) {
          errors.push(`Row ${rowNum} (${name}): Invalid quantity`);
          return;
        }

        const material: Material = {
          name,
          quantity,
          unit: row.unit || 'EA',
        };

        if (row.material_code) material.material_code = row.material_code;
        if (row.brand) material.brand = row.brand;
        if (row.manufacturer) material.manufacturer = row.manufacturer;
        if (row.cost_code) material.cost_code = row.cost_code;

        const waste = validateNumber(row.waste_percentage, 'waste_percentage', rowNum);
        if (waste !== null) {
          if (waste > 100) {
            errors.push(`Row ${rowNum} (${name}): Waste percentage cannot exceed 100%`);
          } else {
            material.waste_percentage = waste;
          }
        }

        const price = validateNumber(row.price_per_unit, 'price_per_unit', rowNum);
        if (price !== null) {
          material.price_per_unit = price;
          material.unitPrice = price;
        }

        materials.push(material);
      });

      if (errors.length > 0) {
        setErrors(errors);
        toast({ 
          title: 'Import Warnings', 
          description: `${materials.length} materials imported with ${errors.length} warnings`,
        });
      }

      if (materials.length > 0) {
        onImportComplete(materials, projectName, state, county);
        toast({ title: 'Success', description: `${materials.length} materials imported successfully` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process materials', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file || !projectName) {
      toast({ title: 'Error', description: 'Please provide project name and CSV file', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setErrors([]);
    try {
      const text = await file.text();
      const { materials, errors: parseErrors } = parseCSV(text);
      
      if (parseErrors.length > 0) {
        setErrors(parseErrors);
        toast({ 
          title: 'Import Warnings', 
          description: `${materials.length} materials imported with ${parseErrors.length} warnings`,
          variant: parseErrors.length > materials.length ? 'destructive' : 'default'
        });
      }

      if (materials.length > 0) {
        onImportComplete(materials, projectName, state, county);
        if (parseErrors.length === 0) {
          toast({ title: 'Success', description: `${materials.length} materials imported successfully` });
        }
      } else {
        toast({ title: 'Error', description: 'No valid materials found in CSV', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to parse CSV file', variant: 'destructive' });
      setErrors(['Failed to parse CSV file. Please check the file format.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CSVMappingWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        csvContent={csvContent}
        onComplete={handleWizardComplete}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Material Import
          </CardTitle>
          <CardDescription>
            Upload a CSV file with materials. Use Smart Import for any CSV format from Procore, Buildertrend, or custom templates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <Wand2 className="h-4 w-4 text-purple-600" />
            <AlertDescription>
              <strong className="text-purple-900">New: Smart Import Wizard!</strong> Upload any CSV format and we'll help you map the columns automatically. Compatible with Procore, Buildertrend, and Excel exports.
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <h4 className="font-semibold text-sm text-blue-900">Need a CSV template?</h4>
              <p className="text-xs text-blue-700">Download our template with example materials and all available columns</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Import Errors/Warnings:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.slice(0, 10).map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                  {errors.length > 10 && (
                    <li className="font-semibold">...and {errors.length - 10} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Enter project name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state">State (Optional)</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g., CA" />
            </div>
            <div>
              <Label htmlFor="county">County (Optional)</Label>
              <Input id="county" value={county} onChange={(e) => setCounty(e.target.value)} placeholder="e.g., Los Angeles" />
            </div>
          </div>
          <div>
            <Label htmlFor="csvFile">CSV File</Label>
            <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleSmartImport} disabled={loading || !file || !projectName} variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Wand2 className="mr-2 h-4 w-4" />
              Smart Import Wizard
            </Button>
            <Button onClick={handleImport} disabled={loading || !file || !projectName} variant="outline">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Quick Import
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Use Smart Import for custom CSV formats or Quick Import if your file matches our template
          </p>
        </CardContent>
      </Card>
    </>
  );
}
