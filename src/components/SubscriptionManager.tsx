import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setSubscription(profile);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };


  const handleUpgrade = async (tier: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('stripe-subscription', {
        body: { action: 'create_checkout', userId: user.id, email: user.email, tier },
      });

      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  const handleCancel = async () => {
    try {
      const { error } = await supabase.functions.invoke('stripe-subscription', {
        body: { action: 'cancel', subscriptionId: subscription?.stripe_subscription_id },
      });

      if (error) throw error;
      toast.success('Subscription cancelled');
      loadSubscription();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) return <div>Loading...</div>;

  const isTrialActive = subscription?.subscription_status === 'trial' && 
    new Date(subscription?.trial_ends_at) > new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-2xl font-bold capitalize">{subscription?.subscription_tier}</p>
          </div>
          <Badge variant={subscription?.subscription_status === 'active' ? 'default' : 'secondary'}>
            {subscription?.subscription_status}
          </Badge>
        </div>

        {isTrialActive && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">Trial ends: {new Date(subscription.trial_ends_at).toLocaleDateString()}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Button onClick={() => handleUpgrade('basic')} variant="outline">
            Basic - $499/year
          </Button>
          <Button onClick={() => handleUpgrade('pro')} variant="outline">
            Pro - $999/year
          </Button>
          <Button onClick={() => handleUpgrade('enterprise')} variant="outline">
            Enterprise - $2499/year
          </Button>
        </div>

        {subscription?.subscription_status === 'active' && (
          <Button onClick={handleCancel} variant="destructive">Cancel Subscription</Button>
        )}
      </CardContent>
    </Card>
  );
}
