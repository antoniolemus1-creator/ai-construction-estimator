import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Key, CreditCard, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function UserLicenseManager() {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      loadUserLicenses();
    }
  }, [user]);

  const loadUserLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .eq('email', user?.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicenses(data || []);
    } catch (err) {
      toast.error('Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getProgressPercentage = (createdAt: string, expiresAt: string) => {
    const created = new Date(createdAt).getTime();
    const expires = new Date(expiresAt).getTime();
    const now = new Date().getTime();
    const total = expires - created;
    const elapsed = now - created;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const handleRenewLicense = async (licenseId: string) => {
    toast.info('Redirecting to payment...');
    // Integrate with Stripe or payment provider
  };

  const handlePurchaseNew = () => {
    toast.info('Redirecting to purchase page...');
    // Redirect to purchase flow
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Licenses</h2>
        <Button onClick={handlePurchaseNew}>
          <Plus className="w-4 h-4 mr-2" />
          Purchase License
        </Button>
      </div>

      {licenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Licenses Found</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any active licenses yet.
            </p>
            <Button onClick={handlePurchaseNew}>
              Purchase Your First License
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {licenses.map((license) => {
            const daysRemaining = getDaysRemaining(license.expires_at);
            const progress = getProgressPercentage(license.created_at, license.expires_at);
            const isExpired = daysRemaining < 0;
            const isExpiringSoon = daysRemaining < 30 && daysRemaining >= 0;

            return (
              <Card key={license.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        {license.organization || 'License'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {license.license_tier?.toUpperCase() || 'STANDARD'} TIER
                      </p>
                    </div>
                    <Badge variant={isExpired ? 'destructive' : license.status === 'active' ? 'default' : 'secondary'}>
                      {isExpired ? 'Expired' : license.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time Remaining</span>
                      <span className={isExpired ? 'text-red-500 font-semibold' : isExpiringSoon ? 'text-yellow-500 font-semibold' : ''}>
                        {isExpired ? 'Expired' : `${daysRemaining} days`}
                      </span>
                    </div>
                    <Progress value={100 - progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Activated: {new Date(license.created_at).toLocaleDateString()}</span>
                      <span>Expires: {new Date(license.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground mb-2">License Key</div>
                    <code className="block p-2 bg-muted rounded text-xs break-all">
                      {license.license_key}
                    </code>
                  </div>

                  {(isExpired || isExpiringSoon) && (
                    <Button 
                      onClick={() => handleRenewLicense(license.id)}
                      className="w-full"
                      variant={isExpired ? 'destructive' : 'default'}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isExpired ? 'Renew License' : 'Extend License'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
