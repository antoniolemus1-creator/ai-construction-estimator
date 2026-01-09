import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Search, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | 'success';
  action: string;
  description: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  resource_type: string | null;
  resource_id: string | null;
  status: string | null;
  error_message: string | null;
}

export function SystemLogsViewer() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('24h');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply date filter
      if (dateFilter !== 'all') {
        const hours = dateFilter === '24h' ? 24 : dateFilter === '7d' ? 168 : dateFilter === '30d' ? 720 : 0;
        if (hours > 0) {
          const date = new Date();
          date.setHours(date.getHours() - hours);
          query = query.gte('created_at', date.toISOString());
        }
      }

      // Apply severity filter
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }

      // Apply event type filter
      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Set up real-time subscription
    const channel = supabase
      .channel('system_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_logs' }, (payload) => {
        setLogs((prev) => [payload.new as SystemLog, ...prev].slice(0, 500));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [severityFilter, eventTypeFilter, dateFilter]);

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'User Email', 'Event Type', 'Severity', 'Action', 'Description', 'Status', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.created_at,
        log.user_email || 'N/A',
        log.event_type,
        log.severity,
        log.action,
        log.description || '',
        log.status || '',
        log.ip_address || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString()}.csv`;
    a.click();
    toast.success('Logs exported successfully');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'error': return 'bg-red-500 text-white';
      case 'warning': return 'bg-yellow-500 text-white';
      case 'success': return 'bg-green-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Logs & Audit Trail</span>
            <div className="flex gap-2">
              <Button onClick={fetchLogs} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportLogs} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="api">API Call</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="user">User Action</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading logs...</div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-4">
                Showing {filteredLogs.length} of {logs.length} logs
              </div>
              <div className="max-h-[600px] overflow-y-auto space-y-2">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{log.event_type}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-medium text-sm mb-1">{log.action}</div>
                        {log.description && (
                          <div className="text-sm text-gray-600 mb-2">{log.description}</div>
                        )}
                        <div className="flex gap-4 text-xs text-gray-500">
                          {log.user_email && <span>User: {log.user_email}</span>}
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                          {log.status && <span>Status: {log.status}</span>}
                        </div>
                        {log.error_message && (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
