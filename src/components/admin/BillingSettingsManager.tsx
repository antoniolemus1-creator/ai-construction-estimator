import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { DollarSign, Percent } from 'lucide-react';

export function BillingSettingsManager() {
  const [baseSubscription, setBaseSubscription] = useState(50);
  const [markupPercentage, setMarkupPercentage] = useState(100);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('billing_settings').select('*');
    if (data) {
      data.forEach(setting => {
        if (setting.setting_key === 'base_subscription_fee') {
          setBaseSubscription(setting.setting_value.amount);
        } else if (setting.setting_key === 'api_markup_percentage') {
          setMarkupPercentage(setting.setting_value.percentage);
        }
      });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      await supabase.from('billing_settings').upsert([
        { setting_key: 'base_subscription_fee', setting_value: { amount: baseSubscription, currency: 'USD' } },
        { setting_key: 'api_markup_percentage', setting_value: { percentage: markupPercentage } }
      ], { onConflict: 'setting_key' });
      toast.success('Billing settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="base">Base Subscription Fee ($/month)</Label>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <Input id="base" type="number" value={baseSubscription} onChange={(e) => setBaseSubscription(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <Label htmlFor="markup">API Markup Percentage (%)</Label>
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            <Input id="markup" type="number" value={markupPercentage} onChange={(e) => setMarkupPercentage(Number(e.target.value))} />
          </div>
        </div>
        <Button onClick={saveSettings} disabled={loading}>Save Settings</Button>
      </CardContent>
    </Card>
  );
}
