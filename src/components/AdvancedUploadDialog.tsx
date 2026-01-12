import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Upload, FileText, Ruler, BookOpen, X, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, AlertCircle, Layers, SplitSquareVertical,
  Building, Home, Wrench, Eye
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface AdvancedUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: (planIds: string[], config: UploadConfig) => void;
  projectName: string;
}

interface UploadConfig {
  documentType: 'drawings' | 'specs';
  scale?: string;
  selectedSheetTypes: string[];
  selectedPageNumbers: number[];
  csiDivisions?: string[];
}

interface PagePreview {
  pageNumber: number;
  thumbnail: string;
  sheetType: string;
  selected: boolean;
  title?: string;
}

// Sheet type categories for construction drawings
const SHEET_TYPES = [
  { code: 'A', name: 'Architectural', icon: Building, color: 'blue' },
  { code: 'S', name: 'Structural', icon: Layers, color: 'red' },
  { code: 'M', name: 'Mechanical', icon: Wrench, color: 'green' },
  { code: 'E', name: 'Electrical', icon: Wrench, color: 'yellow' },
  { code: 'P', name: 'Plumbing', icon: Wrench, color: 'cyan' },
  { code: 'ID', name: 'Interior Design', icon: Home, color: 'purple' },
  { code: 'L', name: 'Landscape', icon: Home, color: 'emerald' },
  { code: 'C', name: 'Civil', icon: Building, color: 'orange' },
  { code: 'G', name: 'General/Cover', icon: FileText, color: 'gray' },
];

const CSI_DIVISIONS = [
  '03 - Concrete',
  '04 - Masonry',
  '05 - Metals',
  '06 - Wood, Plastics, Composites',
  '07 - Thermal and Moisture Protection',
  '08 - Openings',
  '09 - Finishes',
  '10 - Specialties',
  '12 - Furnishings',
];

export function AdvancedUploadDialog({ open, onClose, onComplete, projectName }: AdvancedUploadDialogProps) {
  const [step, setStep] = useState<'type' | 'upload' | 'pages' | 'config'>('type');
  const [documentType, setDocumentType] = useState<'drawings' | 'specs'>('drawings');
  const [files, setFiles] = useState<File[]>([]);
  const [pagePreviews, setPagePreviews] = useState<PagePreview[]>([]);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Config options
  const [scale, setScale] = useState('');
  const [selectedSheetTypes, setSelectedSheetTypes] = useState<string[]>(['A', 'S', 'ID']);
  const [selectedCsiDivisions, setSelectedCsiDivisions] = useState<string[]>([]);

  const { toast } = useToast();

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep('type');
      setFiles([]);
      setPagePreviews([]);
      setScale('');
      setSelectedSheetTypes(['A', 'S', 'ID']);
      setSelectedCsiDivisions([]);
    }
  }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setFiles(selectedFiles);

    // For drawings, try to generate page previews (but allow skip on error)
    if (documentType === 'drawings') {
      try {
        await generatePagePreviews(selectedFiles);
      } catch (err) {
        console.error('Preview generation failed, skipping to config:', err);
        toast({
          title: 'Preview unavailable',
          description: 'Proceeding without page previews. All pages will be selected.',
        });
        setStep('config');
      }
    } else {
      // For specs, just proceed
      setStep('config');
    }
  };

  const skipPreviewAndUpload = () => {
    // Skip preview step and go directly to config with all pages selected
    setPagePreviews([]);
    setStep('config');
  };

  const generatePagePreviews = async (selectedFiles: File[]) => {
    setLoadingPreviews(true);
    setPreviewProgress(0);
    const allPreviews: PagePreview[] = [];
    let totalPages = 0;
    let processedPages = 0;
    let errorCount = 0;

    try {
      // First pass: count total pages
      for (const file of selectedFiles) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          totalPages += pdf.numPages;
        } catch (e) {
          console.warn('Could not read PDF:', file.name, e);
          // Estimate pages for failed PDFs
          totalPages += Math.ceil(file.size / 500000); // Rough estimate: 500KB per page
        }
      }

      if (totalPages === 0) totalPages = 1; // Prevent division by zero

      // Second pass: generate thumbnails
      for (const file of selectedFiles) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          for (let i = 1; i <= pdf.numPages; i++) {
            try {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 0.2 }); // Smaller scale for speed

              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              if (!context) {
                throw new Error('Could not get canvas context');
              }

              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({ canvasContext: context, viewport }).promise;

              // Try to detect sheet type from text
              let text = '';
              let sheetType = 'A';
              try {
                const textContent = await page.getTextContent();
                text = textContent.items?.map((item: any) => item.str || '').join(' ') || '';
                sheetType = detectSheetType(text, file.name, i);
              } catch (textError) {
                console.warn('Could not extract text from page', i);
              }

              allPreviews.push({
                pageNumber: allPreviews.length + 1,
                thumbnail: canvas.toDataURL('image/jpeg', 0.4),
                sheetType,
                selected: ['A', 'S', 'ID'].includes(sheetType),
                title: extractSheetTitle(text, file.name, i)
              });
            } catch (pageError) {
              console.warn(`Error processing page ${i}:`, pageError);
              errorCount++;
              // Add placeholder for failed page
              allPreviews.push({
                pageNumber: allPreviews.length + 1,
                thumbnail: '',
                sheetType: 'A',
                selected: true,
                title: `${file.name} - Page ${i} (preview failed)`
              });
            }

            processedPages++;
            setPreviewProgress((processedPages / totalPages) * 100);
          }
        } catch (fileError) {
          console.error('Error processing file:', file.name, fileError);
          errorCount++;
          // Add single placeholder for entire failed file
          allPreviews.push({
            pageNumber: allPreviews.length + 1,
            thumbnail: '',
            sheetType: 'A',
            selected: true,
            title: `${file.name} (could not read PDF)`
          });
        }
      }

      if (allPreviews.length > 0) {
        setPagePreviews(allPreviews);
        setStep('pages');

        if (errorCount > 0) {
          toast({
            title: 'Some pages could not be previewed',
            description: `${errorCount} page(s) had issues but you can still proceed with upload.`,
          });
        }
      } else {
        throw new Error('No pages could be processed');
      }
    } catch (error) {
      console.error('Error generating previews:', error);
      toast({
        title: 'Error loading PDF',
        description: 'Could not generate page previews. Proceeding to upload without previews.',
        variant: 'destructive'
      });
      // Skip preview and go straight to config
      setStep('config');
    } finally {
      setLoadingPreviews(false);
    }
  };

  const detectSheetType = (text: string, fileName: string, pageNum: number): string => {
    const upperText = (text + ' ' + fileName).toUpperCase();

    if (/\bA[-\s]?\d|ARCHITECTURAL|FLOOR\s*PLAN|ELEV|SECTION/i.test(upperText)) return 'A';
    if (/\bS[-\s]?\d|STRUCTURAL|FOUNDATION|FRAMING/i.test(upperText)) return 'S';
    if (/\bM[-\s]?\d|MECHANICAL|HVAC|DUCT/i.test(upperText)) return 'M';
    if (/\bE[-\s]?\d|ELECTRICAL|PANEL|LIGHTING/i.test(upperText)) return 'E';
    if (/\bP[-\s]?\d|PLUMBING|PIPING|SANITARY/i.test(upperText)) return 'P';
    if (/\bID[-\s]?\d|INTERIOR|FINISH|MILLWORK/i.test(upperText)) return 'ID';
    if (/\bL[-\s]?\d|LANDSCAPE|PLANTING|IRRIGATION/i.test(upperText)) return 'L';
    if (/\bC[-\s]?\d|CIVIL|SITE|GRADING/i.test(upperText)) return 'C';
    if (/COVER|INDEX|GENERAL|SYMBOL|LEGEND/i.test(upperText)) return 'G';

    return 'A'; // Default to architectural
  };

  const extractSheetTitle = (text: string, fileName: string, pageNum: number): string => {
    // Try to find sheet number patterns like "A1.01" or "S-201"
    const sheetMatch = text.match(/[A-Z]{1,2}[-\s]?\d+\.?\d*/i);
    if (sheetMatch) return sheetMatch[0].toUpperCase();

    // Fall back to file name + page number
    const baseName = fileName.replace(/\.pdf$/i, '');
    return `${baseName} - Page ${pageNum}`;
  };

  const togglePageSelection = (pageNumber: number) => {
    setPagePreviews(prev => prev.map(p =>
      p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectBySheetType = (sheetType: string, selected: boolean) => {
    setPagePreviews(prev => prev.map(p =>
      p.sheetType === sheetType ? { ...p, selected } : p
    ));

    if (selected && !selectedSheetTypes.includes(sheetType)) {
      setSelectedSheetTypes(prev => [...prev, sheetType]);
    } else if (!selected) {
      setSelectedSheetTypes(prev => prev.filter(t => t !== sheetType));
    }
  };

  const selectAllPages = () => {
    setPagePreviews(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAllPages = () => {
    setPagePreviews(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const handleUpload = async () => {
    const selectedPages = pagePreviews.filter(p => p.selected);

    // Only block if user explicitly deselected all pages after preview
    // If pagePreviews is empty (preview skipped), allow upload - will extract all pages
    if (documentType === 'drawings' && pagePreviews.length > 0 && selectedPages.length === 0) {
      toast({
        title: 'No pages selected',
        description: 'Please select at least one page to extract.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const uploadedPlanIds: string[] = [];
      const totalFiles = files.length;

      for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
        const file = files[fileIdx];
        const fileName = `${user.id}/${Date.now()}_${file.name}`;

        console.log('Uploading file:', fileName, 'Size:', file.size);

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('construction-plans')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload success:', uploadData);

        // Create plan record
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .insert({
            user_id: user.id,
            project_name: projectName,
            file_path: fileName,
            file_url: fileName,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            document_type: documentType === 'drawings' ? 'drawings' : 'specifications',
            has_specifications: documentType === 'specs',
            selected_pages: documentType === 'drawings' ? selectedPages.map(p => p.pageNumber) : null,
            extraction_config: {
              documentType,
              scale,
              selectedSheetTypes,
              csiDivisions: selectedCsiDivisions
            }
          })
          .select()
          .single();

        if (planError) throw planError;
        uploadedPlanIds.push(planData.id);

        setUploadProgress(((fileIdx + 1) / totalFiles) * 100);
      }

      toast({
        title: 'Upload complete!',
        description: `${files.length} file(s) uploaded with ${selectedPages.length} pages selected for extraction.`
      });

      onComplete(uploadedPlanIds, {
        documentType,
        scale,
        selectedSheetTypes,
        selectedPageNumbers: selectedPages.map(p => p.pageNumber),
        csiDivisions: selectedCsiDivisions
      });

      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const selectedCount = pagePreviews.filter(p => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === 'type' && 'Select Document Type'}
            {step === 'upload' && `Upload ${documentType === 'drawings' ? 'Construction Drawings' : 'Specifications'}`}
            {step === 'pages' && 'Select Pages for Extraction'}
            {step === 'config' && 'Configure Extraction'}
          </DialogTitle>
          <DialogDescription>
            {step === 'type' && 'Choose whether you are uploading drawings or specifications. They should be uploaded separately.'}
            {step === 'upload' && (documentType === 'drawings'
              ? 'Upload your construction drawings (floor plans, sections, elevations, etc.)'
              : 'Upload your project specifications (CSI format documents).')}
            {step === 'pages' && 'Select which pages/sheets to include in the takeoff extraction.'}
            {step === 'config' && 'Configure extraction settings for your documents.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {/* Step 1: Document Type Selection */}
          {step === 'type' && (
            <div className="grid grid-cols-2 gap-4">
              <Card
                className={`p-6 cursor-pointer transition-all hover:shadow-md ${documentType === 'drawings' ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                onClick={() => setDocumentType('drawings')}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <Ruler className="h-12 w-12 text-blue-600" />
                  <h3 className="font-semibold text-lg">Construction Drawings</h3>
                  <p className="text-sm text-muted-foreground">
                    Floor plans, elevations, sections, details, schedules
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Badge variant="secondary">Architectural</Badge>
                    <Badge variant="secondary">Structural</Badge>
                    <Badge variant="secondary">Interior Design</Badge>
                  </div>
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all hover:shadow-md ${documentType === 'specs' ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}
                onClick={() => setDocumentType('specs')}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <BookOpen className="h-12 w-12 text-purple-600" />
                  <h3 className="font-semibold text-lg">Specifications</h3>
                  <p className="text-sm text-muted-foreground">
                    CSI format specs, materials, methods, requirements
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Badge variant="secondary">Materials</Badge>
                    <Badge variant="secondary">Methods</Badge>
                    <Badge variant="secondary">Standards</Badge>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              {documentType === 'specs' && (
                <Alert className="bg-purple-50 border-purple-200">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Specifications Upload:</strong> Spec documents are typically large.
                    The system will extract text and materials information from all pages.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {files.length === 0 ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Click to select PDF files
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        You can select multiple files at once
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </Label>
                  </>
                ) : (
                  <div className="space-y-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Label htmlFor="more-files" className="cursor-pointer text-blue-600 text-sm">
                      + Add more files
                      <Input
                        id="more-files"
                        type="file"
                        accept=".pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const newFiles = Array.from(e.target.files || []);
                          setFiles(prev => [...prev, ...newFiles]);
                        }}
                      />
                    </Label>
                  </div>
                )}
              </div>

              {loadingPreviews && (
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">
                    Generating page previews...
                  </p>
                  <Progress value={previewProgress} />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={skipPreviewAndUpload}
                  >
                    Skip Preview & Upload All Pages
                  </Button>
                </div>
              )}

              {files.length > 0 && !loadingPreviews && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={skipPreviewAndUpload}
                >
                  Skip Preview & Upload All Pages
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Page Selection (Drawings only) */}
          {step === 'pages' && (
            <div className="space-y-4">
              {/* Sheet type filters */}
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium w-full mb-1">Filter by sheet type:</span>
                {SHEET_TYPES.map(type => {
                  const count = pagePreviews.filter(p => p.sheetType === type.code).length;
                  const selectedInType = pagePreviews.filter(p => p.sheetType === type.code && p.selected).length;
                  if (count === 0) return null;

                  return (
                    <Button
                      key={type.code}
                      size="sm"
                      variant={selectedSheetTypes.includes(type.code) ? 'default' : 'outline'}
                      onClick={() => selectBySheetType(type.code, !selectedSheetTypes.includes(type.code))}
                      className="gap-1"
                    >
                      {type.name}
                      <Badge variant="secondary" className="ml-1">{selectedInType}/{count}</Badge>
                    </Button>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAllPages}>
                    Select All ({pagePreviews.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAllPages}>
                    Deselect All
                  </Button>
                </div>
                <Badge variant={selectedCount > 0 ? 'default' : 'secondary'}>
                  {selectedCount} pages selected
                </Badge>
              </div>

              {/* Page grid */}
              <ScrollArea className="h-[400px] border rounded-lg p-2">
                <div className="grid grid-cols-4 gap-3">
                  {pagePreviews.map(page => (
                    <Card
                      key={page.pageNumber}
                      className={`p-2 cursor-pointer transition-all ${page.selected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => togglePageSelection(page.pageNumber)}
                    >
                      <div className="relative">
                        <img
                          src={page.thumbnail}
                          alt={`Page ${page.pageNumber}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        {page.selected && (
                          <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-1">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <Badge
                          className="absolute bottom-1 left-1"
                          variant="secondary"
                        >
                          {page.sheetType}
                        </Badge>
                      </div>
                      <p className="text-xs text-center mt-1 truncate" title={page.title}>
                        {page.title || `Page ${page.pageNumber}`}
                      </p>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Step 4: Configuration */}
          {step === 'config' && (
            <div className="space-y-6">
              {documentType === 'drawings' && (
                <Card className="p-4">
                  <Label className="font-semibold">Drawing Scale</Label>
                  <Input
                    value={scale}
                    onChange={(e) => setScale(e.target.value)}
                    placeholder="e.g., 1/4 inch = 1 foot"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the scale shown on your drawings for accurate measurements
                  </p>
                </Card>
              )}

              {documentType === 'specs' && (
                <Card className="p-4">
                  <Label className="font-semibold mb-3 block">Select CSI Divisions to Extract</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CSI_DIVISIONS.map(div => (
                      <div key={div} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCsiDivisions.includes(div)}
                          onCheckedChange={(checked) => {
                            setSelectedCsiDivisions(prev =>
                              checked ? [...prev, div] : prev.filter(d => d !== div)
                            );
                          }}
                        />
                        <Label className="text-sm cursor-pointer">{div}</Label>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Alert>
                <Eye className="h-4 w-4" />
                <AlertDescription>
                  {documentType === 'drawings' ? (
                    <>
                      <strong>{pagePreviews.length > 0 ? `${selectedCount} pages` : 'All pages'}</strong> will be analyzed for takeoff data including:
                      walls, doors, windows, ceilings, casework, and more.
                    </>
                  ) : (
                    <>
                      Specifications will be analyzed for materials, methods, and requirements
                      from the selected CSI divisions.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'type') onClose();
              else if (step === 'upload') setStep('type');
              else if (step === 'pages') { setStep('upload'); setFiles([]); setPagePreviews([]); }
              // If preview was skipped (pagePreviews empty), go back to upload, not pages
              else if (step === 'config') setStep(documentType === 'drawings' && pagePreviews.length > 0 ? 'pages' : 'upload');
            }}
            disabled={uploading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 'type' ? 'Cancel' : 'Back'}
          </Button>

          {uploading && (
            <div className="flex-1 mx-4">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground mt-1">Uploading...</p>
            </div>
          )}

          <Button
            onClick={() => {
              if (step === 'type') setStep('upload');
              else if (step === 'upload' && documentType === 'specs') setStep('config');
              else if (step === 'pages') setStep('config');
              else if (step === 'config') handleUpload();
            }}
            disabled={
              uploading ||
              loadingPreviews ||
              (step === 'upload' && files.length === 0) ||
              (step === 'pages' && selectedCount === 0)
            }
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            {step === 'config' ? 'Upload & Start Extraction' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
