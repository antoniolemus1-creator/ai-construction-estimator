import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function VerifyLicensePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyLicense();
  }, [token]);

  const verifyLicense = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('activate-license', {
        body: { 
          verificationToken: token, 
          action: 'verify' 
        }
      });

      if (error) throw error;

      setStatus('success');
      setMessage('License activated successfully! You can now use the application.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-white animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-8 h-8 text-white" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-white" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying License...'}
            {status === 'success' && 'License Activated!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'success' && (
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          )}
          {status === 'error' && (
            <Button onClick={() => navigate('/activate-license')} variant="outline" className="w-full">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
