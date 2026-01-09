import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Save, RefreshCw, Brain, Sliders, CheckCircle2 } from 'lucide-react';

interface ExtractionSettings {
  extraction_sensitivity: number;
  detail_level: string;
  auto_extract_doors: boolean;
  auto_extract_windows: boolean;
  auto_extract_walls: boolean;
  auto_extract_fixtures: boolean;
  auto_extract_electrical: boolean;
  auto_extract_plumbing: boolean;
  auto_extract_hvac: boolean;
  auto_extract_structural: boolean;
  min_confidence_auto_accept: number;
  require_manual_review_below: number;
}

export function AIExtractionSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ExtractionSettings>({
    extraction_sensitivity: 0.7,
    detail_level: 'medium',
    auto_extract_doors: true,
    auto_extract_windows: true,
    auto_extract_walls: true,
    auto_extract_fixtures: true,
    auto_extract_electrical: true,
    auto_extract_plumbing: true,
    auto_extract_hvac: true,
    auto_extract_structural: true,
    min_confidence_auto_accept: 0.85,
    require_manual_review_below: 0.70,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_extraction_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_extraction_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      toast({
        title: 'Settings Saved',
        description: 'AI extraction settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sensitivity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sensitivity">
            <Sliders className="w-4 h-4 mr-2" />
            Sensitivity
          </TabsTrigger>
          <TabsTrigger value="item-types">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Item Types
          </TabsTrigger>
          <TabsTrigger value="confidence">
            <Brain className="w-4 h-4 mr-2" />
            Confidence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sensitivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extraction Sensitivity</CardTitle>
              <CardDescription>
                Adjust how sensitive the AI is when detecting items in plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Sensitivity Level: {(settings.extraction_sensitivity * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.extraction_sensitivity * 100]}
                  onValueChange={(value) => setSettings({ ...settings, extraction_sensitivity: value[0] / 100 })}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Higher sensitivity detects more items but may include false positives
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Detail Level</Label>
                <Select
                  value={settings.detail_level}
                  onValueChange={(value) => setSettings({ ...settings, detail_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Fast, basic extraction</SelectItem>
                    <SelectItem value="medium">Medium - Balanced speed and detail</SelectItem>
                    <SelectItem value="high">High - Detailed, slower extraction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="item-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auto-Extract Item Types</CardTitle>
              <CardDescription>
                Choose which item types to automatically extract from plans
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'auto_extract_doors', label: 'Doors' },
                { key: 'auto_extract_windows', label: 'Windows' },
                { key: 'auto_extract_walls', label: 'Walls' },
                { key: 'auto_extract_fixtures', label: 'Fixtures' },
                { key: 'auto_extract_electrical', label: 'Electrical' },
                { key: 'auto_extract_plumbing', label: 'Plumbing' },
                { key: 'auto_extract_hvac', label: 'HVAC' },
                { key: 'auto_extract_structural', label: 'Structural' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={key}>{label}</Label>
                  <Switch
                    id={key}
                    checked={settings[key as keyof ExtractionSettings] as boolean}
                    onCheckedChange={(checked) => setSettings({ ...settings, [key]: checked })}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Thresholds</CardTitle>
              <CardDescription>
                Set minimum confidence scores for auto-acceptance and manual review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Auto-Accept Threshold: {(settings.min_confidence_auto_accept * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.min_confidence_auto_accept * 100]}
                  onValueChange={(value) => setSettings({ ...settings, min_confidence_auto_accept: value[0] / 100 })}
                  min={50}
                  max={100}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Items above this confidence are automatically accepted
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Manual Review Threshold: {(settings.require_manual_review_below * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.require_manual_review_below * 100]}
                  onValueChange={(value) => setSettings({ ...settings, require_manual_review_below: value[0] / 100 })}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-sm text-muted-foreground">
                  Items below this confidence require manual review
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
