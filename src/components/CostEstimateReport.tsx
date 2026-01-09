import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Save, Loader2, BookTemplate, FileText, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import SaveAsTemplateModal from './SaveAsTemplateModal';
import { ProposalGenerator } from './ProposalGenerator';

import EnhancedEstimateEditor from './EnhancedEstimateEditor';




interface Material {
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  error?: string;
}

interface CostEstimateReportProps {
  materials: Material[];
  projectName: string;
  state?: string;
  county?: string;
  onPricingComplete?: () => void;
}

export default function CostEstimateReport({ materials, projectName, state, county, onPricingComplete }: CostEstimateReportProps) {
  const [pricedMaterials, setPricedMaterials] = useState<Material[]>(materials);
  const [taxRate, setTaxRate] = useState(8.5);
  const [markupPercentage, setMarkupPercentage] = useState(15);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showEnhancedEditor, setShowEnhancedEditor] = useState(false);
  const { toast } = useToast();




  useEffect(() => {
    fetchPricing();
  }, [materials]);

  const fetchPricing = async () => {
    setLoading(true);
    const updated = [...materials];
    
    for (let i = 0; i < updated.length; i++) {
      try {
        const response = await supabase.functions.invoke('rsmeans-pricing', {
          body: { action: 'search', searchTerm: updated[i].name, state, county }
        });
        
        if (response.data?.results?.[0]) {
          const result = response.data.results[0];
          updated[i].unitPrice = result.unit_price || 0;
          updated[i].totalPrice = (result.unit_price || 0) * updated[i].quantity;
        } else {
          updated[i].error = 'No pricing found';
        }
      } catch (error) {
        updated[i].error = 'Pricing failed';
      }
    }
    
    setPricedMaterials(updated);
    setLoading(false);
    onPricingComplete?.();
  };

  const subtotal = pricedMaterials.reduce((sum, m) => sum + (m.totalPrice || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const markupAmount = subtotal * (markupPercentage / 100);
  const total = subtotal + taxAmount + markupAmount;

  const saveEstimate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('bulk_estimates').insert({
        project_name: projectName,
        materials: pricedMaterials,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        markup_percentage: markupPercentage,
        markup_amount: markupAmount,
        total,
        state,
        county
      });
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Estimate saved successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save estimate', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Material', 'Quantity', 'Unit', 'Unit Price', 'Total Price'],
      ...pricedMaterials.map(m => [m.name, m.quantity, m.unit, m.unitPrice?.toFixed(2) || 'N/A', m.totalPrice?.toFixed(2) || 'N/A']),
      [],
      ['Subtotal', '', '', '', subtotal.toFixed(2)],
      ['Tax (' + taxRate + '%)', '', '', '', taxAmount.toFixed(2)],
      ['Markup (' + markupPercentage + '%)', '', '', '', markupAmount.toFixed(2)],
      ['Total', '', '', '', total.toFixed(2)]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_estimate.csv`;
    a.click();
  };

  const handleEnhancedSave = async (estimateData: any) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('bulk_estimates').insert({
        project_name: estimateData.projectName,
        materials: estimateData.materials,
        subtotal: estimateData.grandTotal,
        tax_rate: estimateData.taxRate,
        tax_amount: estimateData.taxAmount,
        markup_percentage: estimateData.profitPercent,
        markup_amount: estimateData.profit,
        total: estimateData.grandTotal,
        state,
        county,
        enhanced_data: estimateData
      });
      
      if (error) throw error;
      toast({ title: 'Success', description: 'Enhanced estimate saved successfully' });
      setShowEnhancedEditor(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save enhanced estimate', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (showEnhancedEditor) {
    return <EnhancedEstimateEditor materials={pricedMaterials} projectName={projectName} onSave={handleEnhancedSave} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Estimate Report - {projectName}</CardTitle>
        <CardDescription>{state && county ? `${county}, ${state}` : 'Location not specified'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Fetching pricing...</div>}
        
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
            {pricedMaterials.map((m, i) => (
              <TableRow key={i}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.quantity}</TableCell>
                <TableCell>{m.unit}</TableCell>
                <TableCell>{m.unitPrice ? `$${m.unitPrice.toFixed(2)}` : m.error || 'N/A'}</TableCell>
                <TableCell>{m.totalPrice ? `$${m.totalPrice.toFixed(2)}` : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <Label>Tax Rate (%)</Label>
            <Input type="number" value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value))} />
          </div>
          <div>
            <Label>Markup (%)</Label>
            <Input type="number" value={markupPercentage} onChange={(e) => setMarkupPercentage(parseFloat(e.target.value))} />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between"><span>Subtotal:</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Tax ({taxRate}%):</span><span>${taxAmount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Markup ({markupPercentage}%):</span><span>${markupAmount.toFixed(2)}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total:</span><span>${total.toFixed(2)}</span></div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setShowEnhancedEditor(true)} className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700" disabled={loading}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Rates & Costs
          </Button>
          <Button onClick={saveEstimate} disabled={saving || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Estimate
          </Button>
          <Button onClick={() => setShowTemplateModal(true)} variant="secondary" disabled={loading}>
            <BookTemplate className="mr-2 h-4 w-4" />
            Save as Template
          </Button>
          <Button onClick={() => setShowProposalModal(true)} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" disabled={loading}>
            <FileText className="mr-2 h-4 w-4" />
            Generate AI Proposal
          </Button>
          <Button onClick={exportCSV} variant="outline" disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

      </CardContent>

      <SaveAsTemplateModal 
        open={showTemplateModal} 
        onOpenChange={setShowTemplateModal}
        materials={pricedMaterials.map(m => ({ name: m.name, quantity: m.quantity, unit: m.unit }))}
      />

      <ProposalGenerator
        open={showProposalModal}
        onOpenChange={setShowProposalModal}
        projectName={projectName}
        materials={pricedMaterials}
        subtotal={subtotal}
        taxAmount={taxAmount}
        markupAmount={markupAmount}
        total={total}
        state={state}
        county={county}
      />
    </Card>

  );
}

