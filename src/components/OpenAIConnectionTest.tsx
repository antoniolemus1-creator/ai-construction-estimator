import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OpenAIConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('Testing OpenAI connection...');
      const { data, error } = await supabase.functions.invoke('test-openai-simple');
      
      console.log('Test result:', { data, error });
      
      if (error) {
        setResult({
          success: false,
          error: error.message || 'Failed to invoke test function'
        });
        return;
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('Test error:', err);
      setResult({
        success: false,
        error: err.message || 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick OpenAI Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test OpenAI Connection'
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  {result.success ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-green-700">✓ OpenAI Connection Successful!</p>
                      <p className="text-sm">Model: {result.model}</p>
                      <p className="text-sm">Response: {result.message}</p>
                      <p className="text-sm text-muted-foreground">
                        Tokens: {result.tokens_used} | Cost: ${result.cost?.toFixed(6)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold">✗ Connection Failed</p>
                      <p className="text-sm">{result.error}</p>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
