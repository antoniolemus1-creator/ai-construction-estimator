import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Mail, Trash2, UserPlus } from 'lucide-react';

export function TeamManagement() {
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .single();

      if (profile?.organization_id) {
        const { data: membersData } = await supabase
          .from('organization_members')
          .select('*, user_profiles(full_name, email)')
          .eq('organization_id', profile.organization_id)
          .is('deleted_at', null);

        const { data: invitationsData } = await supabase
          .from('organization_invitations')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString());

        setMembers(membersData || []);
        setInvitations(invitationsData || []);
      }
    } catch (error: any) {
      console.error('Error loading team:', error);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id')
        .single();

      const token = crypto.randomUUID();

      const { error } = await supabase
        .from('organization_invitations')
        .insert({
          organization_id: profile.organization_id,
          email,
          role,
          token,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Invitation sent!');
      setEmail('');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
      loadTeamData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading}>
              <Mail className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.user_profiles?.full_name || 'N/A'}</TableCell>
                  <TableCell>{member.user_profiles?.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}