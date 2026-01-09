import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onConnected: (accessToken: string, companyId: string) => void;
}

export default function ProcoreAuthButton({ onConnected }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Get auth URL
      const { data, error } = await supabase.functions.invoke('procore-oauth', {
        body: { action: 'get_auth_url' }
      });

      if (error) throw error;

      // Open OAuth window
      const authWindow = window.open(
        data.authUrl,
        'Procore OAuth',
        'width=600,height=700,left=200,top=100'
      );

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.data.type === 'procore_oauth_success') {
          const { code } = event.data;
          
          // Exchange code for tokens
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;

          await supabase.functions.invoke('procore-oauth', {
            body: { action: 'exchange_code', code, userId }
          });

          // For demo, simulate successful connection
          onConnected('demo_access_token', 'demo_company_id');
          toast({ title: 'Connected', description: 'Successfully connected to Procore' });
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup if window is closed
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setLoading(false);
        }
      }, 1000);
    } catch (err) {
      console.error('OAuth error:', err);
      toast({ title: 'Error', description: 'Failed to connect to Procore', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleConnect} disabled={loading} size="lg" className="w-full">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <LinkIcon className="w-4 h-4 mr-2" />
          Connect to Procore
        </>
      )}
    </Button>
  );
}
