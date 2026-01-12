import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Loader2, CheckCircle, Image as ImageIcon, AlertCircle, Sparkles, FileText, Shield, PlayCircle, Download, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { AIClarificationDialog } from './AIClarificationDialog';
import AIDynamicSchemaManager from './AIDynamicSchemaManager';
import { PlanAnalysisSetupDialog, AnalysisConfig } from './PlanAnalysisSetupDialog';
import { OCRTextExtractor } from './OCRTextExtractor';
import { TextSearchPanel } from './TextSearchPanel';
import { TextHighlightAnnotator } from './TextHighlightAnnotator';
import { OCRExportPanel } from './OCRExportPanel';
import { ExtractionConfig } from './DocumentTypeSelector';
import { useBackgroundExtraction } from '@/hooks/useBackgroundExtraction';
import { exportComprehensiveTakeoff, exportToQuickBid, exportToBuildertrend, exportToQuickBooks, TakeoffItem } from '@/lib/excelExport';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;


interface VisionExtractorPanelProps {
  planId: string;
  onComplete: (switchToChat?: boolean) => void;
  extractionConfig?: ExtractionConfig;
}

interface PageThumbnail {
  pageNumber: number;
  imageUrl: string;
  status: 'pending' | 'processing' | 'complete' | 'error' | 'needs-clarification';
  missingInfo?: string[];
  analysis?: any;
}
export function VisionExtractorPanel({ planId, onComplete, extractionConfig }: VisionExtractorPanelProps) {

  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [showClarificationDialog, setShowClarificationDialog] = useState(false);
  const [needsClarification, setNeedsClarification] = useState(false);
  const [missingInfoSummary, setMissingInfoSummary] = useState<string[]>([]);
  const [showDynamicSchema, setShowDynamicSchema] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig | null>(null);
  const [documentType, setDocumentType] = useState<'drawings' | 'specifications' | 'both'>('drawings');
  const [planName, setPlanName] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Background extraction
  const { startExtraction, isExtracting, getJobByPlanId } = useBackgroundExtraction();
  const backgroundJob = getJobByPlanId(planId);
  const isBackgroundExtracting = isExtracting(planId);

  useEffect(() => {
    loadSettings();
    loadPlanInfo();
    // If extraction config is provided, use it to set the analysis config
    if (extractionConfig) {
      const config: AnalysisConfig = {
        drawingScale: extractionConfig.scale || undefined,
        takeoffItems: Array.isArray(extractionConfig.extractionOptions) ? extractionConfig.extractionOptions : [],
        specDivisions: Array.isArray(extractionConfig.csiDivisions) ? extractionConfig.csiDivisions : []
      };
      setAnalysisConfig(config);
    }
  }, [planId, extractionConfig]);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_extraction_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Gracefully handle missing table or other errors (406, PGRST116)
      if (error) {
        // PGRST116 = no rows found, 406 = table might not exist
        if (error.code !== 'PGRST116') {
          console.warn('Could not load extraction settings, using defaults:', error.message);
        }
        // Use default settings
        setSettings({
          extraction_sensitivity: 0.7,
          detail_level: 'medium',
          auto_extract_doors: true,
          auto_extract_windows: true,
          auto_extract_walls: true,
          auto_extract_fixtures: true,
        });
        return;
      }

      setSettings(data);
    } catch (error) {
      console.warn('Error loading settings, using defaults:', error);
      setSettings({
        extraction_sensitivity: 0.7,
        detail_level: 'medium',
        auto_extract_doors: true,
        auto_extract_windows: true,
        auto_extract_walls: true,
        auto_extract_fixtures: true,
      });
    }
  };

  const loadPlanInfo = async () => {
    try {
      const { data } = await supabase
        .from('plans')
        .select('document_type, has_specifications, file_name, name')
        .eq('id', planId)
        .single();

      if (data) {
        setDocumentType(data.document_type || (data.has_specifications ? 'specifications' : 'drawings'));
        setPlanName(data.name || data.file_name || 'Takeoff');
      }
    } catch (error) {
      console.error('Error loading plan info:', error);
    }
  };

  // Generic export handler for all formats
  const handleExport = async (format: 'excel' | 'quickbid' | 'buildertrend' | 'quickbooks') => {
    setExporting(true);
    setExportType(format);
    try {
      // Fetch all takeoff data for this plan
      const { data: takeoffData, error } = await supabase
        .from('takeoff_data')
        .select('*')
        .eq('plan_id', planId);

      if (error) throw error;

      if (!takeoffData || takeoffData.length === 0) {
        toast({
          title: 'No data to export',
          description: 'No extraction data found for this plan. Run extraction first.',
          variant: 'destructive'
        });
        return;
      }

      switch (format) {
        case 'excel':
          exportComprehensiveTakeoff(planName, takeoffData as TakeoffItem[]);
          toast({ title: 'Excel export complete', description: `Exported ${takeoffData.length} items` });
          break;
        case 'quickbid':
          exportToQuickBid(planName, takeoffData as TakeoffItem[]);
          toast({ title: 'QuickBid export complete', description: `Exported ${takeoffData.length} items to QuickBid format` });
          break;
        case 'buildertrend':
          exportToBuildertrend(planName, takeoffData as TakeoffItem[]);
          toast({ title: 'Buildertrend export complete', description: `Exported ${takeoffData.length} items to Buildertrend format` });
          break;
        case 'quickbooks':
          exportToQuickBooks(planName, takeoffData as TakeoffItem[]);
          toast({ title: 'QuickBooks export complete', description: `Exported ${takeoffData.length} items to QuickBooks format` });
          break;
      }
    } catch (error: unknown) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
      setExportType('');
    }
  };

  // Navigate to plan viewer for review
  const handleViewInPlanViewer = () => {
    navigate(`/plan-viewer/${planId}`);
  };

  // Auto-navigate to plan viewer when extraction completes
  useEffect(() => {
    if (backgroundJob?.status === 'completed') {
      // Show toast and auto-navigate after a brief delay
      toast({
        title: 'Extraction Complete!',
        description: 'Navigating to Plan Viewer for review...'
      });
      const timer = setTimeout(() => {
        navigate(`/plan-viewer/${planId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [backgroundJob?.status, planId, navigate, toast]);




  const convertPdfPageToImage = async (pdf: any, pageNum: number): Promise<string> => {
    const page = await pdf.getPage(pageNum);

    // Get the original viewport to calculate dimensions
    const originalViewport = page.getViewport({ scale: 1.0 });

    // Calculate scale to keep image under max dimensions (2048px max for API limits)
    // This prevents base64 images from exceeding Supabase's request size limit
    const MAX_DIMENSION = 2048;
    const maxOriginalDim = Math.max(originalViewport.width, originalViewport.height);
    const scale = maxOriginalDim > MAX_DIMENSION ? MAX_DIMENSION / maxOriginalDim : 1.0;

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    // Use lower quality to reduce payload size (0.6 is still good for OCR/vision)
    return canvas.toDataURL('image/jpeg', 0.6);
  };

  const handleStartExtraction = (runInBackground = false) => {
    // If we already have extraction config from the parent, use it directly
    if (extractionConfig && analysisConfig) {
      if (runInBackground) {
        handleBackgroundExtract(analysisConfig);
      } else {
        handleExtract(analysisConfig);
      }
    } else {
      // For now, start setup dialog. Could add background option here too.
      setShowSetupDialog(true);
    }
  };

  const handleConfigSubmit = (config: AnalysisConfig) => {
    setAnalysisConfig(config);
    handleExtract(config);
  };

  const handleBackgroundExtract = async (config?: AnalysisConfig) => {
    const jobId = await startExtraction(
      planId,
      planName || 'Plan',
      documentType,
      config || analysisConfig || undefined
    );

    if (jobId) {
      toast({
        title: 'Background Extraction Started',
        description: 'You can navigate away - extraction will continue in the background.',
      });
    }
  };

  const handleExtract = async (config?: AnalysisConfig) => {

    setExtracting(true);
    setProgress(5);
    setTotalItems(0);

    try {
      // Get file path from unified plans table
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('file_url, file_path, file_name')
        .eq('id', planId)
        .single();

      if (planError || !planData) {
        throw new Error('Plan not found in database');
      }

      let filePath: string | null = null;

      // Try file_url first (newer uploads)
      if (planData.file_url) {
        // Extract file path from the public URL
        // URL format: https://.../storage/v1/object/public/construction-plans/USER_ID/TIMESTAMP_FILENAME.pdf
        const urlParts = planData.file_url.split('/construction-plans/');
        if (urlParts.length > 1) {
          filePath = decodeURIComponent(urlParts[1]);
        }
      }
      
      // Fallback to file_path (older uploads)
      if (!filePath && planData.file_path) {
        filePath = planData.file_path;
      }

      if (!filePath) throw new Error('Plan file not found');


      setProgress(10);

      // Get a signed URL from Supabase storage (for private buckets)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('construction-plans')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (urlError || !signedUrlData?.signedUrl) {
        console.error('Signed URL error:', urlError);
        throw new Error('Could not generate signed URL for plan');
      }



      // Load PDF
      const loadingTask = pdfjsLib.getDocument(signedUrlData.signedUrl);

      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      setTotalPages(numPages);

      // Initialize thumbnails
      const initialThumbnails: PageThumbnail[] = Array.from({ length: numPages }, (_, i) => ({
        pageNumber: i + 1,
        imageUrl: '',
        status: 'pending'
      }));
      setThumbnails(initialThumbnails);

      setProgress(20);
      // Process each page based on document type
      let itemsExtracted = 0;
      let hasClarificationNeeds = false;
      let allMissingInfo: string[] = [];
      
      for (let i = 1; i <= numPages; i++) {
        setCurrentPage(i);
        
        setThumbnails(prev => prev.map(t => 
          t.pageNumber === i ? { ...t, status: 'processing' } : t
        ));

        const imageDataUrl = await convertPdfPageToImage(pdf, i);
        
        setThumbnails(prev => prev.map(t => 
          t.pageNumber === i ? { ...t, imageUrl: imageDataUrl } : t
        ));

        // Process based on document type
        if (documentType === 'both') {
          // Parallel processing for both vision and OCR
          const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
            body: {
              planId,
              action: 'extract_both',
              imageUrl: imageDataUrl,
              pageNumber: i
            }
          });

          if (error) {
            setThumbnails(prev => prev.map(t => 
              t.pageNumber === i ? { ...t, status: 'error' } : t
            ));
            toast({ title: `Page ${i} failed`, description: error.message, variant: 'destructive' });
            continue;
          }

          if (data?.success) {
            setThumbnails(prev => prev.map(t => 
              t.pageNumber === i ? { ...t, status: 'complete' } : t
            ));
            itemsExtracted += (data.itemsStored || 0) + 1; // vision items + OCR
            setTotalItems(itemsExtracted);
          }
        } else if (documentType === 'specifications') {
          // OCR extraction for specifications
          const { data: ocrData, error: ocrError } = await supabase.functions.invoke('analyze-construction-plans', {
            body: {
              planId,
              action: 'extract_ocr_text',
              imageUrl: imageDataUrl,
              pageNumber: i
            }
          });

          if (ocrError) {
            setThumbnails(prev => prev.map(t => 
              t.pageNumber === i ? { ...t, status: 'error' } : t
            ));
            toast({ title: `Page ${i} OCR failed`, description: ocrError.message, variant: 'destructive' });
            continue;
          }

          if (ocrData?.success) {
            setThumbnails(prev => prev.map(t => 
              t.pageNumber === i ? { ...t, status: 'complete' } : t
            ));
            itemsExtracted += 1;
          }
        } else {
          // Vision extraction for drawings
          // Sanitize analysisConfig to ensure arrays are properly formatted
          const configToUse = config || analysisConfig;
          const safeConfig = configToUse ? {
            drawingScale: configToUse.drawingScale || undefined,
            takeoffItems: Array.isArray(configToUse.takeoffItems) ? configToUse.takeoffItems : [],
            specDivisions: Array.isArray(configToUse.specDivisions) ? configToUse.specDivisions : [],
          } : undefined;

          try {
            const { data, error } = await supabase.functions.invoke('analyze-construction-plans', {
              body: {
                planId,
                action: 'extract_with_vision',
                imageUrl: imageDataUrl,
                pageNumber: i,
                analysisConfig: safeConfig
              }
            });

            if (error) {
              console.error(`Page ${i} error:`, error);
              setThumbnails(prev => prev.map(t =>
                t.pageNumber === i ? { ...t, status: 'error' } : t
              ));
              toast({ title: `Page ${i} extraction failed`, description: error.message, variant: 'destructive' });
              continue;
            }

            if (data) {
              setThumbnails(prev => prev.map(t =>
                t.pageNumber === i ? { ...t, status: 'complete' } : t
              ));

              const itemsFound = data.itemsStored || 0;
              itemsExtracted += itemsFound;
              setTotalItems(itemsExtracted);
            }
          } catch (pageError) {
            console.error(`Page ${i} exception:`, pageError);
            setThumbnails(prev => prev.map(t =>
              t.pageNumber === i ? { ...t, status: 'error' } : t
            ));
            toast({ title: `Page ${i} failed`, description: 'Request timed out or failed', variant: 'destructive' });
            continue;
          }
        }


        setProgress(20 + (i / numPages) * 75);
      }

      setProgress(95);

      
      // Set clarification state
      if (hasClarificationNeeds) {
        setNeedsClarification(true);
        setMissingInfoSummary([...new Set(allMissingInfo)]); // Remove duplicates
      }

      // Check if we should trigger cross-reference analysis
      await checkAndTriggerCrossReference();

      setProgress(100);
      toast({ 
        title: 'Extraction complete!', 
        description: `${itemsExtracted} items extracted from ${numPages} pages` 
      });
      
      // Wait for database to commit, then automatically switch to AI Chat
      setTimeout(() => {
        console.log('Vision extraction complete, switching to AI Chat');
        toast({ 
          title: 'Ready for AI Chat!', 
          description: 'Automatically switching to AI Chat to analyze your data...',
          duration: 3000
        });
        onComplete(true); // Pass true to indicate we want to switch to chat
      }, 1500);

    } catch (error: any) {
      toast({ title: 'Extraction failed', description: error.message, variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  };

  const checkAndTriggerCrossReference = async () => {
    try {
      // Check if there are both drawings and specifications for this project
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all plans for this user
      const { data: allPlans } = await supabase
        .from('plans')
        .select('id, document_type')
        .eq('user_id', user.id);


      if (!allPlans) return;

      const hasDrawings = allPlans.some(p => p.document_type === 'drawings' || p.document_type === 'both');
      const hasSpecs = allPlans.some(p => p.document_type === 'specifications' || p.document_type === 'both');

      if (hasDrawings && hasSpecs) {
        console.log('Both drawings and specs detected - triggering cross-reference');
        toast({
          title: 'Cross-referencing enabled',
          description: 'Analyzing relationships between drawings and specifications...',
          duration: 3000
        });

        // Trigger cross-reference analysis
        await supabase.functions.invoke('cross-reference-specs-drawings', {
          body: { userId: user.id }
        });
      }
    } catch (error) {
      console.error('Cross-reference check failed:', error);
      // Don't show error to user - this is a background operation
    }
  };


  const [ocrTextId, setOcrTextId] = useState<string>('');

  return (
    <>
      <Tabs defaultValue="vision" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vision">AI Extraction</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>


        <TabsContent value="vision">
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              AI Vision Extraction
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Use AI Vision to automatically extract wall dimensions, ceiling areas, door/window counts from your plans.
            </p>

            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => handleStartExtraction(false)}
                disabled={extracting || isBackgroundExtracting}
                className="flex-1"
              >
                {extracting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Extract with AI Vision
              </Button>

              <Button
                onClick={() => handleStartExtraction(true)}
                disabled={extracting || isBackgroundExtracting}
                variant="outline"
                className="flex-1"
                title="Run in background - you can navigate away"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Run in Background
              </Button>
            </div>

            {/* Show background job status */}
            {isBackgroundExtracting && backgroundJob && (
              <Alert className="mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Extraction running in background</p>
                    <p className="text-sm text-muted-foreground">{backgroundJob.message}</p>
                    <Progress value={backgroundJob.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Page {backgroundJob.currentPage} of {backgroundJob.totalPages} -
                      You can navigate away, extraction will continue.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Show completed background job */}
            {backgroundJob?.status === 'completed' && (
              <Alert className="mb-4 border-green-500 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Background extraction complete!</p>
                        <p className="text-sm">
                          {backgroundJob.results?.itemsExtracted || 0} items extracted from {backgroundJob.results?.pagesProcessed || 0} pages
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleViewInPlanViewer}
                        className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Review in Plan Viewer
                      </Button>
                    </div>

                    {/* Export buttons row */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-green-200">
                      <span className="text-xs text-green-700 w-full mb-1">Export takeoff data to:</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport('excel')}
                        disabled={exporting}
                        className="border-green-600 text-green-700 hover:bg-green-100"
                      >
                        {exporting && exportType === 'excel' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                        Excel
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport('quickbid')}
                        disabled={exporting}
                        className="border-blue-600 text-blue-700 hover:bg-blue-100"
                      >
                        {exporting && exportType === 'quickbid' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                        QuickBid
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport('buildertrend')}
                        disabled={exporting}
                        className="border-orange-600 text-orange-700 hover:bg-orange-100"
                      >
                        {exporting && exportType === 'buildertrend' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                        Buildertrend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport('quickbooks')}
                        disabled={exporting}
                        className="border-purple-600 text-purple-700 hover:bg-purple-100"
                      >
                        {exporting && exportType === 'quickbooks' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                        QuickBooks
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Export buttons when there's existing data (not during extraction) */}
            {!extracting && !isBackgroundExtracting && backgroundJob?.status !== 'completed' && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-muted-foreground w-full mb-1">Export options:</span>
                <Button size="sm" variant="outline" onClick={() => handleExport('excel')} disabled={exporting}>
                  {exporting && exportType === 'excel' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                  Excel
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('quickbid')} disabled={exporting}>
                  {exporting && exportType === 'quickbid' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                  QuickBid
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('buildertrend')} disabled={exporting}>
                  {exporting && exportType === 'buildertrend' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                  Buildertrend
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExport('quickbooks')} disabled={exporting}>
                  {exporting && exportType === 'quickbooks' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                  QuickBooks
                </Button>
                <Button size="sm" variant="default" onClick={handleViewInPlanViewer} className="ml-auto">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Plan
                </Button>
              </div>
            )}

            {extracting && (
              <div className="space-y-3">
                <Progress value={progress} className="mb-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Processing page {currentPage} of {totalPages}...
                </p>
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">{totalItems}</span>
                  <p className="text-xs text-muted-foreground">Items Extracted</p>
                </div>
              </div>
            )}

            {needsClarification && missingInfoSummary.length > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">AI needs clarification on:</p>
                    <ul className="list-disc list-inside text-sm">
                      {missingInfoSummary.map((info, idx) => (
                        <li key={idx}>{info}</li>
                      ))}
                    </ul>
                    <Button 
                      size="sm" 
                      onClick={() => setShowClarificationDialog(true)}
                      className="mt-2"
                    >
                      Provide Clarification
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {thumbnails.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Analyzed Pages
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {thumbnails.map((thumb) => (
                    <div key={thumb.pageNumber} className="relative">
                      {thumb.imageUrl && (
                        <img 
                          src={thumb.imageUrl} 
                          alt={`Page ${thumb.pageNumber}`}
                          className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-80"
                          onClick={() => setCurrentImageUrl(thumb.imageUrl)}
                        />
                      )}
                      <div className="absolute top-1 right-1">
                        {thumb.status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {thumb.status === 'needs-clarification' && <AlertCircle className="w-4 h-4 text-orange-500" />}
                        {thumb.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        {thumb.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </div>
                      <p className="text-xs text-center mt-1">Page {thumb.pageNumber}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {showDynamicSchema && currentImageUrl && (
            <div className="mt-4">
              <AIDynamicSchemaManager 
                planId={planId} 
                imageUrl={currentImageUrl}
                pageNumber={thumbnails.find(t => t.imageUrl === currentImageUrl)?.pageNumber || 1}
              />
            </div>
          )}
        </TabsContent>


        <TabsContent value="search">
          <TextSearchPanel />
        </TabsContent>

      </Tabs>

      <AIClarificationDialog
        planUploadId={planId}
        open={showClarificationDialog}
        onClose={() => setShowClarificationDialog(false)}
        onAnswersSubmitted={() => {
          setShowClarificationDialog(false);
          toast({ 
            title: 'Clarification provided', 
            description: 'AI will use this information to improve extraction accuracy' 
          });
        }}
      />

      <PlanAnalysisSetupDialog
        open={showSetupDialog}
        onClose={() => setShowSetupDialog(false)}
        onSubmit={handleConfigSubmit}
        isDrawing={documentType === 'drawings' || documentType === 'both'}
      />
    </>
  );
}