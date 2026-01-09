import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface OCRExportPanelProps {
  planId: string;
  planName: string;
}

export function OCRExportPanel({ planId, planName }: OCRExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Fetch all OCR text for this plan
      const { data: ocrData, error } = await supabase
        .from('ocr_extracted_text')
        .select('*')
        .eq('plan_id', planId)
        .order('page_number');

      if (error) throw error;

      // Fetch annotations
      const { data: annotations } = await supabase
        .from('text_annotations')
        .select('*')
        .eq('plan_id', planId);

      // Create PDF content
      let content = `${planName}\n\n`;
      
      ocrData?.forEach((page: any) => {
        content += `\n--- Page ${page.page_number} ---\n\n`;
        content += page.extracted_text + '\n\n';
        
        // Add annotations for this page
        const pageAnnotations = annotations?.filter(
          (a: any) => a.ocr_text_id === page.id
        );
        if (pageAnnotations && pageAnnotations.length > 0) {
          content += '\nAnnotations:\n';
          pageAnnotations.forEach((ann: any) => {
            content += `- "${ann.highlighted_text}": ${ann.annotation_text}\n`;
          });
        }
      });

      // Create downloadable file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${planName}_extracted_text.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Text exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export text');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToWord = async () => {
    setIsExporting(true);
    try {
      const { data: ocrData, error } = await supabase
        .from('ocr_extracted_text')
        .select('*')
        .eq('plan_id', planId)
        .order('page_number');

      if (error) throw error;

      const { data: annotations } = await supabase
        .from('text_annotations')
        .select('*')
        .eq('plan_id', planId);

      // Create HTML content for Word
      let htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>${planName}</title>
          </head>
          <body>
            <h1>${planName}</h1>
      `;

      ocrData?.forEach((page: any) => {
        htmlContent += `<h2>Page ${page.page_number}</h2>`;
        htmlContent += `<p>${page.extracted_text.replace(/\n/g, '<br>')}</p>`;
        
        const pageAnnotations = annotations?.filter(
          (a: any) => a.ocr_text_id === page.id
        );
        if (pageAnnotations && pageAnnotations.length > 0) {
          htmlContent += '<h3>Annotations</h3><ul>';
          pageAnnotations.forEach((ann: any) => {
            htmlContent += `<li><strong>"${ann.highlighted_text}"</strong>: ${ann.annotation_text}</li>`;
          });
          htmlContent += '</ul>';
        }
      });

      htmlContent += '</body></html>';

      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.ms-word' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${planName}_extracted_text.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Document exported successfully');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Failed to export document');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-blue-600" />
        Export Extracted Text
      </h3>

      <div className="space-y-2">
        <Button 
          onClick={exportToPDF} 
          disabled={isExporting}
          className="w-full"
          variant="outline"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Export as Text File
        </Button>

        <Button 
          onClick={exportToWord} 
          disabled={isExporting}
          className="w-full"
          variant="outline"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Export as Word Document
        </Button>
      </div>
    </Card>
  );
}