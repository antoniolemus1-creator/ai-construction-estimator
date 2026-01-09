import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionData {
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status, trial_ends_at, subscription_ends_at')
        .eq('id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };


  const hasActiveSubscription = () => {
    if (!subscription) return false;
    
    const isActive = subscription.subscription_status === 'active';
    const isTrial = subscription.subscription_status === 'trial' && 
      subscription.trial_ends_at && 
      new Date(subscription.trial_ends_at) > new Date();
    
    return isActive || isTrial;
  };

  const canAccessFeature = (requiredTier?: string) => {
    if (!hasActiveSubscription()) return false;
    if (!requiredTier) return true;

    const tierLevels: Record<string, number> = {
      'basic': 1,
      'pro': 2,
      'enterprise': 3
    };

    const userLevel = tierLevels[subscription?.subscription_tier || 'basic'] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;

    return userLevel >= requiredLevel;
  };

  return {
    subscription,
    loading,
    hasActiveSubscription: hasActiveSubscription(),
    canAccessFeature,
    refetch: loadSubscription
  };
}
