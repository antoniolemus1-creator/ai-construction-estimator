import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Info, RefreshCw, Copy } from 'lucide-react';

export function TokenDebugger() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: any = {};

    try {
      // 1. Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      diagnostics.userLoggedIn = !!user;
      diagnostics.userId = user?.id || 'Not logged in';

      // 2. Check session
      const { data: { session } } = await supabase.auth.getSession();
      diagnostics.sessionExists = !!session;
      diagnostics.hasAccessToken = !!session?.access_token;
      
      if (session?.access_token) {
        // Parse JWT to check expiry
        const tokenParts = session.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          diagnostics.tokenExpiry = new Date(payload.exp * 1000).toLocaleString();
          diagnostics.tokenIssuer = payload.iss;
          diagnostics.isExpired = Date.now() > payload.exp * 1000;
        }
      }

      // 3. Check if token is anon key
      diagnostics.isAnonKey = session?.access_token === import.meta.env.VITE_SUPABASE_ANON_KEY;

      // 4. Test edge function
      if (session?.access_token) {
        const testResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-construction-plans`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ 
              planId: '00000000-0000-0000-0000-000000000000',
              prompt: 'Debug test'
            }),
          }
        );

        diagnostics.edgeFunctionStatus = testResponse.status;
        diagnostics.edgeFunctionOk = testResponse.ok;
        
        const responseData = await testResponse.json();
        diagnostics.edgeFunctionResponse = responseData;
      }

      // 5. Environment check
      diagnostics.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      diagnostics.hasAnonKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    } catch (error: any) {
      diagnostics.error = error.message;
    }

    setResults(diagnostics);
    setLoading(false);
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      setResults({
        ...results,
        sessionRefreshed: true,
        newTokenReceived: !!session?.access_token
      });
    } catch (error: any) {
      setResults({
        ...results,
        refreshError: error.message
      });
    }
    setLoading(false);
  };

  const copyToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await navigator.clipboard.writeText(session.access_token);
      alert('Token copied to clipboard!');
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">AI Chat Token Debugger</h2>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running...' : 'Run Diagnostics'}
          </Button>
          <Button onClick={refreshSession} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Session
          </Button>
          <Button onClick={copyToken} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Copy Token
          </Button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-2">
            {/* User Status */}
            <Alert className={results.userLoggedIn ? 'border-green-500' : 'border-red-500'}>
              <div className="flex items-center gap-2">
                {results.userLoggedIn ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <AlertDescription>
                  <strong>User Status:</strong> {results.userLoggedIn ? `Logged in (${results.userId})` : 'Not logged in'}
                </AlertDescription>
              </div>
            </Alert>

            {/* Session Status */}
            <Alert className={results.sessionExists ? 'border-green-500' : 'border-red-500'}>
              <div className="flex items-center gap-2">
                {results.sessionExists ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <AlertDescription>
                  <strong>Session:</strong> {results.sessionExists ? 'Active' : 'No session'}
                </AlertDescription>
              </div>
            </Alert>

            {/* Token Status */}
            <Alert className={results.hasAccessToken && !results.isAnonKey ? 'border-green-500' : 'border-red-500'}>
              <div className="flex items-center gap-2">
                {results.hasAccessToken && !results.isAnonKey ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <AlertDescription>
                  <strong>Access Token:</strong> {
                    !results.hasAccessToken ? 'Missing' :
                    results.isAnonKey ? 'ERROR: Using anon key instead of user token!' :
                    results.isExpired ? 'Expired! Refresh needed' :
                    'Valid user token'
                  }
                </AlertDescription>
              </div>
            </Alert>

            {/* Token Expiry */}
            {results.tokenExpiry && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <strong>Token Expires:</strong> {results.tokenExpiry}
                </AlertDescription>
              </Alert>
            )}

            {/* Edge Function Test */}
            {results.edgeFunctionStatus && (
              <Alert className={results.edgeFunctionOk ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {results.edgeFunctionOk ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                  <AlertDescription>
                    <strong>Edge Function:</strong> Status {results.edgeFunctionStatus}
                    {results.edgeFunctionResponse && (
                      <pre className="mt-2 text-xs">{JSON.stringify(results.edgeFunctionResponse, null, 2)}</pre>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Environment */}
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <strong>Supabase URL:</strong> {results.supabaseUrl?.substring(0, 30)}...
              </AlertDescription>
            </Alert>

            {/* Errors */}
            {results.error && (
              <Alert className="border-red-500">
                <XCircle className="w-4 h-4 text-red-500" />
                <AlertDescription>
                  <strong>Error:</strong> {results.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded text-sm">
          <p className="font-semibold mb-2">Quick Fix Steps:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Run Diagnostics" to check current status</li>
            <li>If token is expired, click "Refresh Session"</li>
            <li>If not logged in, sign out and sign in again</li>
            <li>Use "Copy Token" to test with cURL manually</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}