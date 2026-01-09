import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { GitCompare, Loader2, DollarSign, Zap, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import * as pdfjsLib from 'pdfjs-dist';
import { parsePageRanges, detectImageDifference } from '@/lib/pageComparison';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Change {
  type: string;
  description: string;
  location: string;
  oldValue: string;
  newValue: string;
  impact: 'high' | 'medium' | 'low';
  costImpact?: number;
  pageNumber?: number;
}

interface PlanRevisionComparisonProps {
  planId: string;
  revisions: any[];
}

const MAX_CHUNK_SIZE_MB = 10;
const PAGES_PER_CHUNK = 2;

export function PlanRevisionComparison({ planId, revisions }: PlanRevisionComparisonProps) {
  const [fromRevision, setFromRevision] = useState<string>('');
  const [toRevision, setToRevision] = useState<string>('');
  const [comparing, setComparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [changes, setChanges] = useState<Change[]>([]);
  const [summary, setSummary] = useState('');
  const [totalCostImpact, setTotalCostImpact] = useState(0);
  
  // Page filtering states
  const [pageMode, setPageMode] = useState<'all' | 'auto' | 'custom'>('all');
  const [customRange, setCustomRange] = useState('');
  const [detectedChanges, setDetectedChanges] = useState<Map<number, number>>(new Map());
  const [isDetecting, setIsDetecting] = useState(false);


  // Auto-detect pages with changes
  const detectPageChanges = async () => {
    if (!fromRevision || !toRevision) {
      toast.error('Please select both revisions');
      return;
    }

    setIsDetecting(true);
    setDetectedChanges(new Map());
    
    try {
      const fromRev = revisions.find(r => r.id === fromRevision);
      const toRev = revisions.find(r => r.id === toRevision);

      if (!fromRev || !toRev) throw new Error('Revisions not found');

      const { data: { publicUrl: url1 } } = supabase.storage
        .from('construction-plans').getPublicUrl(fromRev.file_url);
      const { data: { publicUrl: url2 } } = supabase.storage
        .from('construction-plans').getPublicUrl(toRev.file_url);

      const pdf1 = await pdfjsLib.getDocument(url1).promise;
      const pdf2 = await pdfjsLib.getDocument(url2).promise;
      const totalPages = Math.min(pdf1.numPages, pdf2.numPages);

      const changedPages = new Map<number, number>();
      
      for (let i = 1; i <= totalPages; i++) {
        const img1 = await convertPdfPageToBase64(url1, i);
        const img2 = await convertPdfPageToBase64(url2, i);
        
        const { isDifferent, diffPercentage } = await detectImageDifference(img1, img2);
        
        if (isDifferent) {
          changedPages.set(i, diffPercentage);
        }
        
        setProgress(Math.round((i / totalPages) * 100));
      }

      setDetectedChanges(changedPages);
      toast.success(`Detected ${changedPages.size} pages with changes`);
    } catch (error: any) {
      toast.error(error.message || 'Detection failed');
    } finally {
      setIsDetecting(false);
      setProgress(0);
    }
  };

  const convertPdfPageToBase64 = async (pdfUrl: string, pageNum: number): Promise<string> => {
    const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 0.5 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.6);
  };

  const calculateCostImpact = (change: Change): number => {
    const costMap: Record<string, number> = {
      wall_added: 150, wall_removed: -50, wall_modified: 75,
      door_added: 500, door_removed: -100,
      window_added: 400, window_removed: -80,
      dimension_changed: 100
    };
    return costMap[change.type] || 0;
  };


  const compareRevisions = async () => {
    if (!fromRevision || !toRevision) {
      toast.error('Please select both revisions');
      return;
    }

    setComparing(true);
    setProgress(0);
    setChanges([]);
    
    try {
      const fromRev = revisions.find(r => r.id === fromRevision);
      const toRev = revisions.find(r => r.id === toRevision);

      if (!fromRev || !toRev) throw new Error('Revisions not found');

      const { data: { publicUrl: url1 } } = supabase.storage
        .from('construction-plans').getPublicUrl(fromRev.file_url);
      const { data: { publicUrl: url2 } } = supabase.storage
        .from('construction-plans').getPublicUrl(toRev.file_url);

      const pdf1 = await pdfjsLib.getDocument(url1).promise;
      const pdf2 = await pdfjsLib.getDocument(url2).promise;
      const totalPages = Math.min(pdf1.numPages, pdf2.numPages);

      // Determine which pages to process
      let pagesToProcess: number[] = [];
      
      if (pageMode === 'all') {
        pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
      } else if (pageMode === 'auto') {
        if (detectedChanges.size === 0) {
          toast.error('Please run auto-detection first');
          setComparing(false);
          return;
        }
        pagesToProcess = Array.from(detectedChanges.keys()).sort((a, b) => a - b);
      } else if (pageMode === 'custom') {
        try {
          pagesToProcess = parsePageRanges(customRange).filter(p => p >= 1 && p <= totalPages);
          if (pagesToProcess.length === 0) throw new Error('No valid pages');
        } catch {
          toast.error('Invalid page range format. Use: 1-5, 12, 20-25');
          setComparing(false);
          return;
        }
      }

      toast.info(`Processing ${pagesToProcess.length} pages...`);
      const allChanges: Change[] = [];

      for (let i = 0; i < pagesToProcess.length; i += PAGES_PER_CHUNK) {
        const chunkPages = [];
        
        for (let j = i; j < i + PAGES_PER_CHUNK && j < pagesToProcess.length; j++) {
          const pageNum = pagesToProcess[j];
          setProgressText(`Processing page ${pageNum}...`);
          const img1 = await convertPdfPageToBase64(url1, pageNum);
          const img2 = await convertPdfPageToBase64(url2, pageNum);
          chunkPages.push({ imageBase64_1: img1, imageBase64_2: img2, pageNumber: pageNum });
        }

        const { data, error } = await supabase.functions.invoke('compare-plan-revisions', {
          body: {
            pages: chunkPages,
            revisionFrom: fromRev.version_number,
            revisionTo: toRev.version_number,
            planId,
            isLastChunk: i + PAGES_PER_CHUNK >= pagesToProcess.length
          }
        });

        if (error) throw new Error(error.message);
        if (data?.changes) allChanges.push(...data.changes);

        setProgress(Math.round(((i + PAGES_PER_CHUNK) / pagesToProcess.length) * 100));
      }

      const changesWithCost = allChanges.map(c => ({
        ...c,
        costImpact: calculateCostImpact(c)
      }));

      setChanges(changesWithCost);
      const skipped = totalPages - pagesToProcess.length;
      setSummary(`Found ${changesWithCost.length} changes across ${pagesToProcess.length} pages${skipped > 0 ? ` (${skipped} pages skipped)` : ''}`);
      setTotalCostImpact(changesWithCost.reduce((sum, c) => sum + (c.costImpact || 0), 0));
      toast.success('Comparison complete');
    } catch (error: any) {
      toast.error(error.message || 'Comparison failed');
    } finally {
      setComparing(false);
      setProgress(0);
      setProgressText('');
    }
  };


  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Compare Revisions</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block">From Revision</label>
            <Select value={fromRevision} onValueChange={setFromRevision}>
              <SelectTrigger><SelectValue placeholder="Select revision" /></SelectTrigger>
              <SelectContent>
                {revisions.map(rev => (
                  <SelectItem key={rev.id} value={rev.id}>
                    Rev {rev.version_number} - {rev.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">To Revision</label>
            <Select value={toRevision} onValueChange={setToRevision}>
              <SelectTrigger><SelectValue placeholder="Select revision" /></SelectTrigger>
              <SelectContent>
                {revisions.map(rev => (
                  <SelectItem key={rev.id} value={rev.id}>
                    Rev {rev.version_number} - {rev.file_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Page Selection Mode */}
        <div className="mb-4 p-4 border rounded-lg bg-muted/30">
          <Label className="text-sm font-medium mb-3 block">Page Selection</Label>
          <RadioGroup value={pageMode} onValueChange={(v: any) => setPageMode(v)} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>All Pages</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="auto" id="auto" />
              <Label htmlFor="auto" className="cursor-pointer flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Auto-detect Changes Only</span>
                {detectedChanges.size > 0 && (
                  <Badge variant="secondary">{detectedChanges.size} pages</Badge>
                )}
              </Label>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer">Custom Range</Label>
              </div>
              {pageMode === 'custom' && (
                <Input
                  placeholder="e.g., 1-5, 12, 20-25"
                  value={customRange}
                  onChange={(e) => setCustomRange(e.target.value)}
                  className="ml-6"
                />
              )}
            </div>
          </RadioGroup>
        </div>

        {/* Auto-detect Button */}
        {pageMode === 'auto' && detectedChanges.size === 0 && (
          <Button 
            onClick={detectPageChanges} 
            disabled={isDetecting || !fromRevision || !toRevision}
            variant="outline"
            className="w-full mb-4"
          >
            {isDetecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            {isDetecting ? 'Detecting Changes...' : 'Run Auto-Detection'}
          </Button>
        )}

        {/* Show detected pages */}
        {detectedChanges.size > 0 && (
          <div className="mb-4 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <p className="text-sm font-medium mb-2">Pages with detected changes:</p>
            <div className="flex flex-wrap gap-2">
              {Array.from(detectedChanges.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([page, diff]) => (
                  <Badge key={page} variant="secondary">
                    Page {page} ({diff.toFixed(1)}% diff)
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <Button onClick={compareRevisions} disabled={comparing || isDetecting} className="w-full">
          {comparing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitCompare className="w-4 h-4 mr-2" />}
          {comparing ? 'Comparing...' : 'Compare Revisions'}
        </Button>

        {(comparing || isDetecting) && progress > 0 && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center mt-2 text-muted-foreground">
              {progressText || `${progress}% complete`}
            </p>
          </div>
        )}
      </Card>


      {summary && (
        <Card className="p-6">
          <h4 className="font-semibold mb-2">Summary</h4>
          <p className="text-muted-foreground">{summary}</p>
        </Card>
      )}

      {totalCostImpact !== 0 && (
        <Card className="p-6 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="font-semibold">Total Cost Impact</span>
            </div>
            <span className={`text-2xl font-bold ${totalCostImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalCostImpact > 0 ? '+' : ''}{totalCostImpact.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </span>
          </div>
        </Card>
      )}

      {changes.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Detected Changes ({changes.length})</h4>
          <div className="space-y-3">
            {changes.map((change, idx) => (
              <div key={idx} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getImpactColor(change.impact)}>{change.impact}</Badge>
                    <span className="font-medium">{change.type.replace(/_/g, ' ').toUpperCase()}</span>
                    {change.pageNumber && <Badge variant="outline">Page {change.pageNumber}</Badge>}
                  </div>
                  {change.costImpact && (
                    <span className={`font-semibold ${change.costImpact > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {change.costImpact > 0 ? '+' : ''}{change.costImpact.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                  )}
                </div>
                <p className="text-sm mb-1">{change.description}</p>
                <p className="text-xs text-muted-foreground">Location: {change.location}</p>
                {change.oldValue && change.newValue && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Changed from <span className="font-medium">{change.oldValue}</span> to <span className="font-medium">{change.newValue}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
