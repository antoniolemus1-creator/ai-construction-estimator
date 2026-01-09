import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataQualityDashboard from '@/components/validation/DataQualityDashboard';
import ValidationRuleEditor from '@/components/validation/ValidationRuleEditor';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function ValidationAnalyticsPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [plans, setPlans] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  useEffect(() => {
    loadPlans();
    loadRules();
  }, []);

  const loadPlans = async () => {
    const { data } = await supabase
      .from('plans')

      .select('id, name')
      .order('created_at', { ascending: false });
    
    if (data && data.length > 0) {
      setPlans(data);
      setSelectedPlanId(data[0].id);
    }
  };

  const loadRules = async () => {
    const { data } = await supabase
      .from('validation_rules')
      .select('*')
      .order('created_at', { ascending: false });
    
    setRules(data || []);
  };

  const handleSaveRule = async (rule: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (rule.id) {
        await supabase
          .from('validation_rules')
          .update(rule)
          .eq('id', rule.id);
        toast.success('Rule updated');
      } else {
        await supabase
          .from('validation_rules')
          .insert({ ...rule, created_by: user.id });
        toast.success('Rule created');
      }
      loadRules();
    } catch (error: any) {
      toast.error('Failed to save rule');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Delete this validation rule?')) return;
    
    try {
      await supabase
        .from('validation_rules')
        .delete()
        .eq('id', ruleId);
      toast.success('Rule deleted');
      loadRules();
    } catch (error: any) {
      toast.error('Failed to delete rule');
    }
  };

  const toggleRuleActive = async (ruleId: string, isActive: boolean) => {
    try {
      await supabase
        .from('validation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);
      loadRules();
    } catch (error: any) {
      toast.error('Failed to update rule');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Data Validation & Quality
          </h1>
          <p className="text-muted-foreground mt-1">
            Validate extracted data and manage quality rules
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Quality Dashboard</TabsTrigger>
          <TabsTrigger value="rules">Validation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full p-2 border rounded"
              >
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {selectedPlanId && <DataQualityDashboard planId={selectedPlanId} />}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingRule(null); setShowRuleEditor(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {rules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{rule.rule_name}</h3>
                        <Badge variant={rule.severity === 'error' ? 'destructive' : 'secondary'}>
                          {rule.severity}
                        </Badge>
                        <Badge variant="outline">{rule.rule_type}</Badge>
                        {!rule.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rule.error_message}</p>
                      {rule.validation_pattern && (
                        <code className="text-xs bg-muted px-2 py-1 rounded">{rule.validation_pattern}</code>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRuleActive(rule.id, rule.is_active)}
                      >
                        {rule.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingRule(rule); setShowRuleEditor(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ValidationRuleEditor
        rule={editingRule}
        open={showRuleEditor}
        onClose={() => setShowRuleEditor(false)}
        onSave={handleSaveRule}
      />
    </div>
  );
}