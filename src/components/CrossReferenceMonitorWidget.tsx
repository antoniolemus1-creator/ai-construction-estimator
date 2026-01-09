import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Bell, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SyncStatus {
  id: string;
  plan_id: string;
  last_sync_at: string;
  sync_status: string;
  total_matches: number;
  total_discrepancies: number;
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
  next_scheduled_sync: string;
  auto_sync_enabled: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export default function CrossReferenceMonitorWidget() {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Subscribe to real-time updates
    const syncChannel = supabase
      .channel('sync-status-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cross_reference_sync_status' },
        () => loadData()
      )
      .subscribe();

    const notifChannel = supabase
      .channel('notification-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cross_reference_notifications' },
        (payload) => {
          const newNotif = payload.new as Notification;
          toast.info(newNotif.title, { description: newNotif.message });
          loadData();
        }
      )
      .subscribe();

    return () => {
      syncChannel.unsubscribe();
      notifChannel.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      const [syncRes, notifRes] = await Promise.all([
        supabase.from('cross_reference_sync_status').select('*').order('last_sync_at', { ascending: false }).limit(5),
        supabase.from('cross_reference_notifications').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(10)
      ]);

      if (syncRes.data) setSyncStatuses(syncRes.data);
      if (notifRes.data) setNotifications(notifRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from('cross_reference_notifications').update({ is_read: true }).eq('id', id);
    loadData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : syncStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sync data available</p>
          ) : (
            <div className="space-y-3">
              {syncStatuses.map((status) => (
                <div key={status.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.sync_status)}
                    <div>
                      <p className="text-sm font-medium">Plan {status.plan_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">
                        {status.total_matches} matches, {status.total_discrepancies} discrepancies
                      </p>
                    </div>
                  </div>
                  {status.high_severity_count > 0 && (
                    <Badge variant="destructive">{status.high_severity_count} high</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications ({notifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No new notifications</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-2 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => markAsRead(notif.id)}>
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}