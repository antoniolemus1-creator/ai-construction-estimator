import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Database, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export function AccessDBImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const parseAccessCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split('\t').map(h => h.trim());
    
    const materials = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });
      
      if (row.Code && row.Description) {
        materials.push({
          material_code: row.Code,
          material_name: row.Description,
          description: row.Description,
          unit_of_measure: row.UOM || 'EA',
          uom_cost: parseFloat(row.UOMCost) || 0,
          price_per_unit: parseFloat(row.UOMCost) || 0,
          waste_percentage: parseFloat(row.Waste) || 0,
          cost_code: row.CostCode,
          section: row.Section,
          manufacturer: row.ItemMfg,
          calc_method: row.CalcMethod,
          is_template: row.IsTemplate === 'TRUE',
          rec_type: parseInt(row.RecType) || 0,
          bid_uid: row.BidUID,
          material_category: row.Section || 'general',
          is_active: true,
          is_specialty: false
        });
      }
    }
    return materials;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    setProgress(0);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const text = await file.text();
      const materials = parseAccessCSV(text);
      
      for (let i = 0; i < materials.length; i++) {
        try {
          const { error } = await supabase
            .from('construction_materials')
            .upsert(materials[i], { onConflict: 'material_code' });
          
          if (error) throw error;
          successCount++;
        } catch (err: any) {
          failedCount++;
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
        setProgress(Math.round(((i + 1) / materials.length) * 100));
      }

      setResults({ success: successCount, failed: failedCount, errors: errors.slice(0, 10) });
      toast.success(`Import complete: ${successCount} materials added`);
    } catch (error: any) {
      toast.error('Failed to import: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Access Database Import
        </CardTitle>
        <CardDescription>
          Import materials from Microsoft Access export (tab-delimited format)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="accessFile">Access Export File</Label>
          <Input
            id="accessFile"
            type="file"
            accept=".csv,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-gray-600">{progress}% complete</p>
          </div>
        )}

        {results && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{results.success} materials imported successfully</span>
            </div>
            {results.failed > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{results.failed} materials failed</span>
              </div>
            )}
          </div>
        )}

        <Button onClick={handleImport} disabled={loading || !file} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Import Materials
        </Button>
      </CardContent>
    </Card>
  );
}
