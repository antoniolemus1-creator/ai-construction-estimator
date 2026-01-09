import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ConflictCard } from './ConflictCard';
import { AlertTriangle, Search, Filter, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ConflictsDashboard({ planId }: { planId?: string }) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [stats, setStats] = useState({ critical: 0, high: 0, medium: 0, low: 0, total: 0 });

  useEffect(() => {
    loadConflicts();
  }, [planId, severityFilter, statusFilter]);

  const loadConflicts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('plan_conflicts')
        .select('*')
        .order('created_at', { ascending: false });

      if (planId) {
        query = query.eq('plan_id', planId);
      }

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setConflicts(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast.error('Failed to load conflicts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const stats = {
      critical: data.filter(c => c.severity === 'critical').length,
      high: data.filter(c => c.severity === 'high').length,
      medium: data.filter(c => c.severity === 'medium').length,
      low: data.filter(c => c.severity === 'low').length,
      total: data.length
    };
    setStats(stats);
  };

  const handleResolve = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('plan_conflicts')
        .update({
          status: 'resolved',
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Conflict marked as resolved');
      loadConflicts();
    } catch (error: any) {
      toast.error('Failed to resolve conflict: ' + error.message);
    }
  };

  const handleDismiss = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('plan_conflicts')
        .update({
          status: 'dismissed',
          resolution_notes: notes,
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Conflict dismissed');
      loadConflicts();
    } catch (error: any) {
      toast.error('Failed to dismiss conflict: ' + error.message);
    }
  };

  const filteredConflicts = conflicts.filter(c =>
    c.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-2xl font-bold text-red-700">{stats.critical}</div>
          <div className="text-sm text-red-600">Critical</div>
        </Card>
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="text-2xl font-bold text-orange-700">{stats.high}</div>
          <div className="text-sm text-orange-600">High</div>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">{stats.medium}</div>
          <div className="text-sm text-yellow-600">Medium</div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{stats.low}</div>
          <div className="text-sm text-blue-600">Low</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Conflicts</div>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conflicts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadConflicts} variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading conflicts...</div>
      ) : filteredConflicts.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Conflicts Found</h3>
          <p className="text-gray-600">No conflicts match your current filters.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConflicts.map((conflict) => (
            <ConflictCard
              key={conflict.id}
              conflict={conflict}
              onResolve={handleResolve}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}