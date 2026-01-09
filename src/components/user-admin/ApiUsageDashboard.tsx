import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp } from 'lucide-react';

export function ApiUsageDashboard() {
  const [totalCost, setTotalCost] = useState(0);
  const [markedUpCost, setMarkedUpCost] = useState(0);
  const [baseFee, setBaseFee] = useState(50);
  const [markup, setMarkup] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    setLoading(true);
    
    // Get current user's license
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: licenseUser } = await supabase
      .from('license_users')
      .select('license_id')
      .eq('user_id', user.id)
      .single();

    if (!licenseUser) return;

    // Get billing settings
    const { data: settings } = await supabase.from('billing_settings').select('*');
    if (settings) {
      settings.forEach(s => {
        if (s.setting_key === 'base_subscription_fee') setBaseFee(s.setting_value.amount);
        if (s.setting_key === 'api_markup_percentage') setMarkup(s.setting_value.percentage);
      });
    }

    // Get API usage for this license
    const { data: usage } = await supabase
      .from('api_usage_tracking')
      .select('cost_usd')
      .eq('license_id', licenseUser.license_id);

    if (usage) {
      const total = usage.reduce((sum, u) => sum + Number(u.cost_usd), 0);
      setTotalCost(total);
      setMarkedUpCost(total * (1 + markup / 100));
    }

    setLoading(false);
  };

  const monthlyTotal = baseFee + markedUpCost;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Base Subscription</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${baseFee.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Per month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">API Usage Cost</CardTitle>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${markedUpCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">This month</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
          <DollarSign className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${monthlyTotal.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Subscription + API</p>
        </CardContent>
      </Card>
    </div>
  );
}
