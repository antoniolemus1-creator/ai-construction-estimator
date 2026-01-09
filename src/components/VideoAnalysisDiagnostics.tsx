import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, Database, Key, Globe, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: any;
}

export default function VideoAnalysisDiagnostics() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [testVideoId, setTestVideoId] = useState('dQw4w9WgXcQ'); // Sample video ID
  const [edgeFunctionResponse, setEdgeFunctionResponse] = useState<any>(null);

  const runDiagnostics = async () => {
    if (!user) {
      alert('Please sign in to run diagnostics');
      return;
    }

    setTesting(true);
    setTestResults([]);
    setEdgeFunctionResponse(null);
    
    const results: TestResult[] = [];

    // Test 1: Check Supabase connection
    try {
      const { data, error } = await supabase.from('analyzed_videos').select('count').limit(1);
      results.push({
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? `Failed: ${error.message}` : 'Connected successfully',
        details: { data, error }
      });
    } catch (err: any) {
      results.push({
        name: 'Supabase Connection',
        status: 'error',
        message: `Exception: ${err.message}`,
        details: err
      });
    }
    setTestResults([...results]);

    // Test 2: Check edge function availability
    try {
      const { data, error } = await supabase.functions.invoke('analyze-video-content', {
        body: { test: true }
      });
      
      results.push({
        name: 'Edge Function Availability',
        status: error ? 'warning' : 'success',
        message: error ? `Function responded with: ${error.message}` : 'Edge function is reachable',
        details: { data, error }
      });
    } catch (err: any) {
      results.push({
        name: 'Edge Function Availability',
        status: 'error',
        message: `Cannot reach edge function: ${err.message}`,
        details: err
      });
    }
    setTestResults([...results]);

    // Test 3: Test with minimal valid payload
    try {
      const minimalPayload = {
        videoId: 'test123',
        userId: user.id,
        videoTitle: 'Test Video',
        videoDescription: 'Test Description'
      };
      
      console.log('Testing with minimal payload:', minimalPayload);
      
      const { data, error } = await supabase.functions.invoke('analyze-video-content', {
        body: minimalPayload
      });
      
      console.log('Minimal payload response:', { data, error });
      
      if (error) {
        results.push({
          name: 'Minimal Payload Test',
          status: 'error',
          message: `Error: ${error.message}`,
          details: { payload: minimalPayload, error }
        });
      } else if (data?.success === false) {
        results.push({
          name: 'Minimal Payload Test',
          status: 'warning',
          message: `Function returned error: ${data.error}`,
          details: { payload: minimalPayload, response: data }
        });
      } else {
        results.push({
          name: 'Minimal Payload Test',
          status: 'success',
          message: 'Function processed minimal payload',
          details: { payload: minimalPayload, response: data }
        });
      }
    } catch (err: any) {
      results.push({
        name: 'Minimal Payload Test',
        status: 'error',
        message: `Exception: ${err.message}`,
        details: err
      });
    }
    setTestResults([...results]);

    // Test 4: Full video analysis test
    try {
      const fullPayload = {
        videoId: testVideoId,
        userId: user.id,
        videoTitle: 'Test Construction Video',
        videoDescription: 'This is a test video about construction estimation techniques including drywall installation and framing.',
        thumbnailUrl: 'https://i.ytimg.com/vi/' + testVideoId + '/mqdefault.jpg'
      };
      
      console.log('Testing full video analysis:', fullPayload);
      
      const { data, error } = await supabase.functions.invoke('analyze-video-content', {
        body: fullPayload
      });
      
      console.log('Full analysis response:', { data, error });
      setEdgeFunctionResponse({ data, error });
      
      if (error) {
        results.push({
          name: 'Full Video Analysis',
          status: 'error',
          message: `Analysis failed: ${error.message}`,
          details: { payload: fullPayload, error }
        });
      } else if (data?.success === false) {
        results.push({
          name: 'Full Video Analysis',
          status: 'warning',
          message: `Analysis returned error: ${data.error}`,
          details: { payload: fullPayload, response: data }
        });
      } else if (data?.success === true) {
        results.push({
          name: 'Full Video Analysis',
          status: 'success',
          message: `Analysis successful! Found ${data.conceptsCount || 0} concepts`,
          details: { payload: fullPayload, response: data }
        });
      } else {
        results.push({
          name: 'Full Video Analysis',
          status: 'warning',
          message: 'Unexpected response format',
          details: { payload: fullPayload, response: data }
        });
      }
    } catch (err: any) {
      results.push({
        name: 'Full Video Analysis',
        status: 'error',
        message: `Exception: ${err.message}`,
        details: err
      });
    }
    setTestResults([...results]);

    // Test 5: Check database for stored results
    if (testVideoId && user) {
      try {
        const { data, error } = await supabase
          .from('analyzed_videos')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', testVideoId)
          .single();
        
        if (data) {
          results.push({
            name: 'Database Storage Check',
            status: 'success',
            message: 'Analysis was stored in database',
            details: data
          });
        } else if (error?.code === 'PGRST116') {
          results.push({
            name: 'Database Storage Check',
            status: 'warning',
            message: 'No analysis found in database for this video',
            details: { error }
          });
        } else {
          results.push({
            name: 'Database Storage Check',
            status: 'error',
            message: error?.message || 'Database check failed',
            details: { error }
          });
        }
      } catch (err: any) {
        results.push({
          name: 'Database Storage Check',
          status: 'error',
          message: `Exception: ${err.message}`,
          details: err
        });
      }
    }
    
    setTestResults([...results]);
    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Loader2 className="w-5 h-5 animate-spin" />;
    }
  };

  const clearAnalyzedVideos = async () => {
    if (!user || !confirm('Clear all your analyzed videos? This cannot be undone.')) return;
    
    const { error } = await supabase
      .from('analyzed_videos')
      .delete()
      .eq('user_id', user.id);
    
    if (!error) {
      alert('Analyzed videos cleared');
    } else {
      alert('Failed to clear: ' + error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Video Analysis Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            This tool helps diagnose issues with the video analysis edge function.
            It will test connectivity, API keys, and the analysis process.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Input 
            placeholder="YouTube Video ID (e.g., dQw4w9WgXcQ)"
            value={testVideoId}
            onChange={(e) => setTestVideoId(e.target.value)}
          />
          <Button onClick={runDiagnostics} disabled={testing || !user}>
            {testing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</> : <><RefreshCw className="w-4 h-4 mr-2" /> Run Diagnostics</>}
          </Button>
          <Button variant="outline" onClick={clearAnalyzedVideos} disabled={!user}>
            Clear Analyzed
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.map((result, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-muted-foreground">{result.message}</div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-blue-500">View Details</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {edgeFunctionResponse && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Edge Function Response:</h3>
            <pre className="p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(edgeFunctionResponse, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}