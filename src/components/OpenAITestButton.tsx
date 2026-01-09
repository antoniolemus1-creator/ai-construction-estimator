import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function OpenAITestButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testOpenAI = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      console.log('Testing OpenAI API...');
      
      const { data, error } = await supabase.functions.invoke('test-openai-simple', {
        body: {}
      });
      
      console.log('Test result:', { data, error });
      
      if (error) {
        setResult({ success: false, error: error.message });
        toast.error('OpenAI test failed: ' + error.message);
      } else if (data?.success) {
        setResult(data);
        toast.success('OpenAI API is working correctly!');
      } else {
        setResult({ success: false, error: data?.error || 'Unknown error' });
        toast.error('OpenAI test failed: ' + (data?.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setResult({ success: false, error: err.message });
      toast.error('Test failed: ' + err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle>OpenAI API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testOpenAI} disabled={testing} className="w-full">
          {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Test OpenAI Connection
        </Button>
        
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-semibold">
                {result.success ? 'Success!' : 'Failed'}
              </span>
            </div>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
