import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, company_name, subscription_tier, subscription_status, subscription_ends_at, stripe_customer_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const extendTrial = async (userId: string) => {
    try {
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + 14);

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          trial_ends_at: newTrialEnd.toISOString(),
          subscription_status: 'trial'
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Trial extended by 14 days');
      loadSubscriptions();
    } catch (error) {
      toast.error('Failed to extend trial');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ends At</TableHead>
              <TableHead>Stripe ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.email}</TableCell>
                <TableCell>{sub.company_name || 'N/A'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{sub.subscription_tier}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={sub.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {sub.subscription_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {sub.subscription_ends_at 
                    ? new Date(sub.subscription_ends_at).toLocaleDateString()
                    : 'N/A'}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {sub.stripe_customer_id || 'N/A'}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => extendTrial(sub.id)}>
                    Extend Trial
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
