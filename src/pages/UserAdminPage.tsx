import { UserAdminDashboard } from '@/components/user-admin/UserAdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UserAdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin');
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <UserAdminDashboard />
      </div>
    </div>
  );
}
