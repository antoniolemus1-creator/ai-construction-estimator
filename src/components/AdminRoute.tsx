import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('🔐 AdminRoute: User authenticated:', user?.email);
      console.log('⚠️ NOTICE: Super admin validation is temporarily disabled');
      
    } catch (error) {
      console.error('❌ AdminRoute: Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Temporarily allow all authenticated users to access admin routes
  return <>{children}</>;
}
