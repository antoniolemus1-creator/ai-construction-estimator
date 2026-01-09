import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface DiagnosticCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  details: string;
}

export default function OpenAIDiagnostics() {
  const [testing, setTesting] = useState(false);
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [testResponse, setTestResponse] = useState<string>('');

  const runDiagnostics = async () => {
    setTesting(true);
    setChecks([]);
    setTestResponse('');

    try {
      console.log('Invoking test-openai-connection function...');
      const { data, error } = await supabase.functions.invoke('test-openai-connection', {
        body: {}
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        toast.error('Failed to run diagnostics: ' + error.message);
        setChecks([{
          name: 'Function Invocation',
          status: 'FAIL',
          details: `Edge function error: ${error.message}`
        }]);
        return;
      }

      if (!data) {
        toast.error('No response from diagnostics function');
        setChecks([{
          name: 'Function Response',
          status: 'FAIL',
          details: 'Function returned no data'
        }]);
        return;
      }

      if (data.diagnostics?.checks) {
        setChecks(data.diagnostics.checks);
        setTestResponse(data.diagnostics.testResponse || '');
      } else {
        setChecks([{
          name: 'Response Format',
          status: 'FAIL',
          details: 'Unexpected response format: ' + JSON.stringify(data).substring(0, 200)
        }]);
      }

      if (data.success) {
        toast.success('All diagnostics passed!');
      } else {
        toast.error('Some diagnostics failed - check details below');
      }
    } catch (err: any) {
      console.error('Caught error:', err);
      toast.error('Error running diagnostics: ' + err.message);
      setChecks([{
        name: 'Unexpected Error',
        status: 'FAIL',
        details: err.message || 'Unknown error occurred'
      }]);
    } finally {
      setTesting(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          OpenAI API Diagnostics
        </CardTitle>
        <CardDescription>
          Test OpenAI API connectivity and troubleshoot issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Diagnostics
            </>
          )}
        </Button>

        {checks.length > 0 && (
          <div className="space-y-3">
            {checks.map((check, idx) => (
              <Alert key={idx} variant={check.status === 'FAIL' ? 'destructive' : 'default'}>
                <div className="flex items-start gap-3">
                  {check.status === 'PASS' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{check.name}</span>
                      <Badge variant={check.status === 'PASS' ? 'default' : 'destructive'}>
                        {check.status}
                      </Badge>
                    </div>
                    <AlertDescription className="text-sm">
                      {check.details}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}

            {testResponse && (
              <Alert>
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <AlertDescription>
                  <strong>Test Response:</strong> {testResponse}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}