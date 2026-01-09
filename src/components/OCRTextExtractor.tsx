import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface OCRTextExtractorProps {
  planId: string;
  imageUrl: string;
  pageNumber?: number;
  onExtractionComplete?: (ocrId: string, text: string) => void;
}

export function OCRTextExtractor({ 
  planId, 
  imageUrl, 
  pageNumber = 1,
  onExtractionComplete 
}: OCRTextExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'extracting' | 'success' | 'error'>('idle');

  const extractText = async () => {
    setIsExtracting(true);
    setStatus('extracting');
    setProgress(10);

    try {
      setProgress(30);
      const { data, error } = await supabase.functions.invoke('extract-text-ocr', {
        body: { planId, imageUrl, pageNumber }
      });

      setProgress(80);

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setExtractedText(data.extractedText);
      setStatus('success');
      setProgress(100);
      toast.success('Text extracted successfully');
      
      if (onExtractionComplete) {
        onExtractionComplete(data.ocrId, data.extractedText);
      }
    } catch (error: any) {
      console.error('OCR extraction error:', error);
      setStatus('error');
      toast.error(`Failed to extract text: ${error.message}`);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">OCR Text Extraction</h3>
        </div>
        {status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        {status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
      </div>

      {status === 'extracting' && (
        <div className="mb-4">
          <Progress value={progress} className="mb-2" />
          <p className="text-sm text-gray-600">Extracting text from page {pageNumber}...</p>
        </div>
      )}

      {status === 'idle' && (
        <Button onClick={extractText} disabled={isExtracting}>
          {isExtracting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Extract Text from Page {pageNumber}
            </>
          )}
        </Button>
      )}

      {extractedText && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap">{extractedText}</p>
        </div>
      )}
    </Card>
  );
}