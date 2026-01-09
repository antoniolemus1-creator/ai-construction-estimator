import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('global_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const createAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('global_announcements')
        .insert({
          title: title.trim(),
          message: message.trim(),
          type,
          created_by: user?.id,
          expires_at: expiresAt || null,
        });

      if (error) throw error;
      toast.success('Announcement created');
      setTitle('');
      setMessage('');
      setExpiresAt('');
      loadAnnouncements();
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('global_announcements')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Announcement updated');
      loadAnnouncements();
    } catch (error) {
      toast.error('Failed to update announcement');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Global Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Announcement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Announcement message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              placeholder="Expires at (optional)"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <Button onClick={createAnnouncement}>Create Announcement</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={announcement.type === 'warning' ? 'destructive' : 'default'}>
                      {announcement.type}
                    </Badge>
                    <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{announcement.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {announcement.expires_at 
                      ? `Expires: ${new Date(announcement.expires_at).toLocaleString()}`
                      : 'No expiration'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(announcement.id, announcement.is_active)}
                  >
                    {announcement.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
