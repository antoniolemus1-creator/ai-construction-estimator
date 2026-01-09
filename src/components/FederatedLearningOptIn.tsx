import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Users, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function FederatedLearningOptIn() {
  const [optedIn, setOptedIn] = useState(false);
  const [shareAnonymized, setShareAnonymized] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_contribution_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setOptedIn(data.opted_in);
      setShareAnonymized(data.share_anonymized);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_contribution_stats')
      .upsert({
        user_id: user.id,
        opted_in: optedIn,
        share_anonymized: shareAnonymized,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved', description: 'Your privacy preferences have been updated.' });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Collaborative Learning Network
        </CardTitle>
        <CardDescription>
          Help improve AI extraction accuracy for everyone while earning rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor="opt-in" className="text-base font-medium">
                Join the Learning Network
              </Label>
              <p className="text-sm text-muted-foreground">
                Share your extraction feedback to help improve the global AI model
              </p>
            </div>
            <Switch
              id="opt-in"
              checked={optedIn}
              onCheckedChange={setOptedIn}
            />
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor="anonymize" className="text-base font-medium">
                Anonymize Data
              </Label>
              <p className="text-sm text-muted-foreground">
                Remove all identifying information before sharing
              </p>
            </div>
            <Switch
              id="anonymize"
              checked={shareAnonymized}
              onCheckedChange={setShareAnonymized}
              disabled={!optedIn}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Privacy First</p>
              <p className="text-xs text-muted-foreground">Your data is protected</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Award className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm font-medium">Earn Rewards</p>
              <p className="text-xs text-muted-foreground">Get points for feedback</p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          Save Privacy Settings
        </Button>
      </CardContent>
    </Card>
  );
}