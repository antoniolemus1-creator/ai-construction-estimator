import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CreateCompanyUserModal } from './CreateCompanyUserModal';

interface CompanyUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  user_type: string;
  created_at: string;
}

export function CompanyUsersManager() {
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserLicense, setCurrentUserLicense] = useState<string | null>(null);
  const [currentUserCompany, setCurrentUserCompany] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUserInfo();
  }, []);

  const loadCurrentUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('company')
      .eq('id', user.id)
      .single();

    const { data: licenseUser } = await supabase
      .from('license_users')
      .select('license_id')
      .eq('user_id', user.id)
      .single();

    if (profile) setCurrentUserCompany(profile.company);
    if (licenseUser) setCurrentUserLicense(licenseUser.license_id);
    
    loadUsers(profile?.company);
  };

  const loadUsers = async (company: string | null) => {
    if (!company) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('company', company)
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
    setLoading(false);
  };

  const handleUserCreated = () => {
    loadUsers(currentUserCompany);
    setShowCreateModal(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Company Users</CardTitle>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{user.full_name || user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge>{user.user_type}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showCreateModal && (
        <CreateCompanyUserModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleUserCreated}
          licenseId={currentUserLicense}
          company={currentUserCompany}
        />
      )}
    </>
  );
}
