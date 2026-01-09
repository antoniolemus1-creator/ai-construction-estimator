import { ReactNode } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionGuardProps {
  children: ReactNode;
  requiredTier?: 'basic' | 'pro' | 'enterprise';
  featureName?: string;
  showUpgrade?: boolean;
}

export function SubscriptionGuard({ 
  children, 
  requiredTier, 
  featureName = 'this feature',
  showUpgrade = true 
}: SubscriptionGuardProps) {
  const { user } = useAuth();
  const { hasActiveSubscription, canAccessFeature, subscription, loading } = useSubscription();

  if (loading) {
    return (
      <Card className="bg-[#1a1f2e] border-cyan-500/20">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="bg-[#1a1f2e] border-yellow-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-yellow-500" />
            Sign In Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">
            Please sign in to access {featureName}.
          </p>
          <Button className="bg-cyan-500 hover:bg-cyan-600">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!hasActiveSubscription) {
    return (
      <Card className="bg-[#1a1f2e] border-yellow-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Crown className="w-5 h-5 text-yellow-500" />
            Premium Feature Locked
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">
            Upgrade to a paid plan to access {featureName}.
          </p>
          {showUpgrade && (
            <Button 
              onClick={() => document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (requiredTier && !canAccessFeature(requiredTier)) {
    return (
      <Card className="bg-[#1a1f2e] border-purple-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Crown className="w-5 h-5 text-purple-500" />
            Upgrade Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-2">
            This feature requires a <span className="font-bold text-purple-400 capitalize">{requiredTier}</span> plan or higher.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Your current plan: <span className="capitalize">{subscription?.subscription_tier}</span>
          </p>
          {showUpgrade && (
            <Button 
              onClick={() => document.getElementById('subscription-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
