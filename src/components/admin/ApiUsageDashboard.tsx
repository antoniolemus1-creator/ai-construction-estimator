import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Percent } from 'lucide-react';

export function ApiUsageDashboard() {
  const [totalCost, setTotalCost] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [profit, setProfit] = useState(0);
  const [profitMargin, setProfitMargin] = useState(0);
  const [baseFee, setBaseFee] = useState(50);
  const [markup, setMarkup] = useState(100);
  const [activeLicenses, setActiveLicenses] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get billing settings
    const { data: settings } = await supabase.from('billing_settings').select('*');
    if (settings) {
      settings.forEach(s => {
        if (s.setting_key === 'base_subscription_fee') setBaseFee(s.setting_value.amount);
        if (s.setting_key === 'api_markup_percentage') setMarkup(s.setting_value.percentage);
      });
    }

    // Get active licenses count
    const { data: licenses } = await supabase
      .from('license_keys')
      .select('id')
      .eq('status', 'active');
    
    const licenseCount = licenses?.length || 0;
    setActiveLicenses(licenseCount);

    // Get all API usage
    const { data: usage } = await supabase
      .from('api_usage_tracking')
      .select('cost_usd');

    if (usage) {
      const cost = usage.reduce((sum, u) => sum + Number(u.cost_usd), 0);
      setTotalCost(cost);
      
      const revenue = cost * (1 + markup / 100) + (baseFee * licenseCount);
      setTotalRevenue(revenue);
      
      const profitAmount = revenue - cost - (baseFee * licenseCount);
      setProfit(profitAmount);
      
      const margin = revenue > 0 ? (profitAmount / revenue) * 100 : 0;
      setProfitMargin(margin);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">API costs only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">With markup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${profit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Net profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{profitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{activeLicenses} active licenses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
