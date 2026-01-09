import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { FileText, Search, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PDFAnalysisDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [planId, setPlanId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;

    try {
      setStatus('uploading');
      setProgress(20);

      // Create plan record
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert({
          name: file.name,
          file_type: 'pdf',
          status: 'uploading'
        })
        .select()
        .single();

      if (planError) throw planError;
      setPlanId(plan.id);
      setProgress(40);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('construction-plans')
        .upload(`plans/${plan.id}.pdf`, file);

      if (uploadError) throw uploadError;
      setProgress(60);

      // Update plan with file URL
      const { data: { publicUrl } } = supabase.storage
        .from('construction-plans')
        .getPublicUrl(uploadData.path);

      await supabase
        .from('plans')
        .update({ 
          file_url: publicUrl,
          status: 'pending_analysis'
        })
        .eq('id', plan.id);

      setStatus('analyzing');
      setProgress(80);

      // Analyze PDF
      const { data: result, error: analysisError } = await supabase.functions.invoke(
        'analyze-construction-plans',
        {
          body: {
            planId: plan.id,
            fileType: 'pdf'
          }
        }
      );

      if (analysisError) throw analysisError;

      if (result.accepted) {
        toast.info('Large PDF - processing in background');
        pollStatus(plan.id);
      } else {
        setProgress(100);
        setStatus('complete');
        toast.success('PDF analyzed successfully!');
      }

    } catch (error: any) {
      toast.error(error.message);
      setStatus('idle');
    }
  };

  const pollStatus = async (id: string) => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('plans')
        .select('status')
        .eq('id', id)
        .single();

      if (data?.status === 'processed') {
        clearInterval(interval);
        setProgress(100);
        setStatus('complete');
        toast.success('PDF processing complete!');
      }
    }, 3000);
  };

  const searchText = async () => {
    if (!searchQuery || !planId) return;

    try {
      // Generate embedding for search
      const { data: embData } = await supabase.functions.invoke('generate-embedding', {
        body: { text: searchQuery }
      });

      // Search using RPC
      const { data: results } = await supabase.rpc('search_plan_text', {
        query_embedding: embData.embedding,
        match_threshold: 0.6,
        match_count: 5
      });

      setSearchResults(results || []);
      toast.success(`Found ${results?.length || 0} matches`);
    } catch (error: any) {
      toast.error('Search failed: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDF Analysis with Embeddings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={status !== 'idle'}
            />
            <Button
              onClick={uploadAndAnalyze}
              disabled={!file || status !== 'idle'}
            >
              {status === 'idle' && <Upload className="w-4 h-4 mr-2" />}
              {status !== 'idle' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Analyze PDF
            </Button>
          </div>

          {status !== 'idle' && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                {status === 'uploading' && 'Uploading PDF...'}
                {status === 'analyzing' && 'Extracting text and generating embeddings...'}
                {status === 'complete' && 'Analysis complete!'}
              </p>
            </div>
          )}

          {status === 'complete' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>PDF processed successfully</span>
            </div>
          )}
        </CardContent>
      </Card>

      {planId && status === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Semantic Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for specifications, materials, etc."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchText()}
              />
              <Button onClick={searchText}>Search</Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Page {result.page_number}</span>
                        <span className="text-sm text-muted-foreground">
                          {(result.similarity * 100).toFixed(1)}% match
                        </span>
                      </div>
                      <p className="text-sm">{result.extracted_text.slice(0, 200)}...</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}