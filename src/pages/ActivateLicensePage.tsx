import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Key, Mail, Globe, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ActivateLicensePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentDomain] = useState(window.location.hostname);

  const verificationToken = searchParams.get('token');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('activate-license', {
        body: { 
          licenseKey, 
          domain: currentDomain, 
          email, 
          action: 'request' 
        }
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your email to complete activation.'
      });
    } catch (error: any) {
      toast({
        title: 'Activation Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <Key className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Activate Your License</CardTitle>
          <CardDescription>
            Enter your license key to activate this domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Verification email sent! Check your inbox to complete activation.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Current Domain</Label>
                <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-md">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-mono">{currentDomain}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseKey">License Key</Label>
                <Input
                  id="licenseKey"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Email
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
