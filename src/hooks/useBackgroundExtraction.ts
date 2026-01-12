import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractionConfig {
  drawingScale?: string;
  takeoffItems?: string[];
  specDivisions?: string[];
}

// Global extraction queue - survives component unmounts
const activeExtractions = new Map<string, {
  aborted: boolean;
  promise: Promise<void>;
}>();

export function useBackgroundExtraction() {
  const { addJob, updateJob, hasActiveJob, getJobByPlanId } = useBackgroundJobs();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const convertPdfPageToImage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number): Promise<string> => {
    const page = await pdf.getPage(pageNum);

    // Get the original viewport to calculate dimensions
    const originalViewport = page.getViewport({ scale: 1.0 });

    // Reduce max dimension to 1536px to keep payload smaller (was 2048)
    // OpenAI Vision works well at this resolution and significantly reduces payload size
    const MAX_DIMENSION = 1536;
    const maxOriginalDim = Math.max(originalViewport.width, originalViewport.height);
    const scale = maxOriginalDim > MAX_DIMENSION ? MAX_DIMENSION / maxOriginalDim : 1.0;

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context!, viewport }).promise;

    // Use 0.5 quality to reduce payload size further (still good for OCR/vision)
    return canvas.toDataURL('image/jpeg', 0.5);
  };

  // Helper to add delay between API calls to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const startExtraction = useCallback(async (
    planId: string,
    planName: string,
    documentType: 'drawings' | 'specifications' | 'both',
    analysisConfig?: ExtractionConfig
  ) => {
    // Check if already extracting this plan
    if (hasActiveJob(planId) || activeExtractions.has(planId)) {
      console.log('Extraction already in progress for plan:', planId);
      return null;
    }

    // Create the job
    const jobId = addJob({
      type: 'extraction',
      planId,
      planName,
      status: 'pending',
      progress: 0,
      currentPage: 0,
      totalPages: 0,
      message: 'Starting extraction...',
    });

    // Create extraction context
    const extractionContext = {
      aborted: false,
      promise: Promise.resolve(),
    };

    // Run extraction
    extractionContext.promise = (async () => {
      try {
        updateJob(jobId, { status: 'processing', message: 'Loading plan file...' });

        // Get file path
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('file_url, file_path, file_name')
          .eq('id', planId)
          .single();

        if (planError || !planData) {
          throw new Error('Plan not found in database');
        }

        let filePath: string | null = null;

        // Try file_path first (direct storage path)
        if (planData.file_path) {
          filePath = planData.file_path;
        }

        // If file_url is a full URL, extract the path
        if (!filePath && planData.file_url) {
          if (planData.file_url.includes('/construction-plans/')) {
            const urlParts = planData.file_url.split('/construction-plans/');
            if (urlParts.length > 1) {
              filePath = decodeURIComponent(urlParts[1]);
            }
          } else {
            // file_url might be just the path itself
            filePath = planData.file_url;
          }
        }

        if (!filePath) throw new Error('Plan file not found');

        // If path includes user folder but file might be at root, try both
        console.log('Original file path:', filePath);

        // Extract just the filename (last part after any slashes)
        const fileNameOnly = filePath.split('/').pop() || filePath;
        console.log('Filename only:', fileNameOnly);

        console.log('Attempting to get signed URL for path:', filePath);

        // Get signed URL - try full path first, then filename only
        let signedUrlData;
        let urlError;

        // Try full path first
        const result1 = await supabase.storage
          .from('construction-plans')
          .createSignedUrl(filePath, 3600);

        if (result1.error && fileNameOnly !== filePath) {
          // Full path failed, try just the filename (root level)
          console.log('Full path failed, trying root level:', fileNameOnly);
          const result2 = await supabase.storage
            .from('construction-plans')
            .createSignedUrl(fileNameOnly, 3600);
          signedUrlData = result2.data;
          urlError = result2.error;
        } else {
          signedUrlData = result1.data;
          urlError = result1.error;
        }

        if (urlError) {
          console.error('Signed URL error:', urlError);
          throw new Error(`Could not generate signed URL: ${urlError.message}`);
        }

        if (!signedUrlData?.signedUrl) {
          console.error('No signed URL returned. Path:', filePath, 'Filename:', fileNameOnly);
          throw new Error('Could not generate signed URL for plan - no URL returned');
        }

        console.log('Successfully got signed URL');

        updateJob(jobId, { progress: 10, message: 'Loading PDF...' });

        // Load PDF
        const pdf = await pdfjsLib.getDocument(signedUrlData.signedUrl).promise;
        const numPages = pdf.numPages;

        updateJob(jobId, {
          progress: 15,
          totalPages: numPages,
          message: `Found ${numPages} pages`,
        });

        let itemsExtracted = 0;
        let wallsFound = 0;
        let pagesProcessed = 0;

        // Process each page
        for (let i = 1; i <= numPages; i++) {
          // Check if aborted
          if (extractionContext.aborted) {
            updateJob(jobId, {
              status: 'failed',
              error: 'Extraction cancelled',
              message: 'Cancelled by user',
            });
            return;
          }

          updateJob(jobId, {
            currentPage: i,
            progress: 15 + ((i - 1) / numPages) * 80,
            message: `Processing page ${i} of ${numPages}...`,
          });

          try {
            const imageDataUrl = await convertPdfPageToImage(pdf, i);

            // Log image size for debugging
            const imageSizeKB = Math.round(imageDataUrl.length * 0.75 / 1024);
            console.log(`Page ${i} image size: ${imageSizeKB} KB`);

            // Process based on document type with retry logic
            let response;
            let retries = 0;
            const maxRetries = 2;

            while (retries <= maxRetries) {
              try {
                if (documentType === 'specifications') {
                  response = await supabase.functions.invoke('analyze-construction-plans', {
                    body: {
                      planId,
                      action: 'extract_ocr_text',
                      imageUrl: imageDataUrl,
                      pageNumber: i,
                    },
                  });
                } else {
                  // Sanitize analysisConfig to ensure arrays are properly formatted
                  const safeConfig = analysisConfig ? {
                    drawingScale: analysisConfig.drawingScale || undefined,
                    takeoffItems: Array.isArray(analysisConfig.takeoffItems) ? analysisConfig.takeoffItems : [],
                    specDivisions: Array.isArray(analysisConfig.specDivisions) ? analysisConfig.specDivisions : [],
                  } : undefined;

                  response = await supabase.functions.invoke('analyze-construction-plans', {
                    body: {
                      planId,
                      action: 'extract_with_vision',
                      imageUrl: imageDataUrl,
                      pageNumber: i,
                      analysisConfig: safeConfig,
                    },
                  });
                }

                // If successful or non-retryable error, break
                if (!response.error || retries >= maxRetries) break;

                // Rate limit or server error - wait and retry
                console.log(`Page ${i} failed, retrying (${retries + 1}/${maxRetries})...`);
                await delay(2000 * (retries + 1)); // Exponential backoff
                retries++;
              } catch (invokeError) {
                console.error(`Page ${i} invoke error:`, invokeError);
                if (retries >= maxRetries) throw invokeError;
                await delay(2000 * (retries + 1));
                retries++;
              }
            }

            if (response?.error) {
              console.error(`Page ${i} error after retries:`, response.error);
              console.error(`Page ${i} error details:`, JSON.stringify(response.error));
              // Continue to next page instead of stopping
              pagesProcessed++; // Still count as processed (with error)
              continue;
            }

            if (response?.data) {
              console.log(`Page ${i} response:`, {
                itemsStored: response.data.itemsStored,
                sheetType: response.data.sheet_type,
                message: response.data.message,
                summary: response.data.summary
              });

              itemsExtracted += response.data.itemsStored || 0;
              wallsFound += response.data.wallsFound || 0;
              pagesProcessed++;

              updateJob(jobId, {
                message: `Page ${i}/${numPages} - ${itemsExtracted} items found (${response.data.sheet_type || 'Unknown'})`,
                results: { itemsExtracted, wallsFound, pagesProcessed },
              });
            } else {
              console.warn(`Page ${i}: No data in response`, response);
              pagesProcessed++;
            }

            // Add small delay between pages to avoid rate limiting (500ms)
            if (i < numPages) {
              await delay(500);
            }
          } catch (pageError) {
            console.error(`Error processing page ${i}:`, pageError);
            // Continue to next page even on error
            pagesProcessed++;
          }
        }

        // Complete
        updateJob(jobId, {
          status: 'completed',
          progress: 100,
          currentPage: numPages,
          message: 'Extraction complete!',
          completedAt: new Date(),
          results: { itemsExtracted, wallsFound, pagesProcessed },
        });

      } catch (error: unknown) {
        console.error('Extraction error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        updateJob(jobId, {
          status: 'failed',
          error: errorMessage,
          message: 'Extraction failed',
        });
      } finally {
        activeExtractions.delete(planId);
      }
    })();

    activeExtractions.set(planId, extractionContext);
    return jobId;
  }, [addJob, updateJob, hasActiveJob]);

  const cancelExtraction = useCallback((planId: string) => {
    const extraction = activeExtractions.get(planId);
    if (extraction) {
      extraction.aborted = true;
    }
  }, []);

  const isExtracting = useCallback((planId: string) => {
    return hasActiveJob(planId) || activeExtractions.has(planId);
  }, [hasActiveJob]);

  return {
    startExtraction,
    cancelExtraction,
    isExtracting,
    getJobByPlanId,
  };
}
