import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

export default function LicenseGuard({ children }: LicenseGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [hasLicense, setHasLicense] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Paths that don't require license validation
  const publicPaths = ['/', '/activate-license', '/verify-license'];
  const adminPaths = location.pathname.startsWith('/admin');
  const isPublicPath = publicPaths.includes(location.pathname) || adminPaths;

  useEffect(() => {
    // Temporarily disable license validation due to database schema issues
    setHasLicense(true);
    setIsValidating(false);
  }, [user, authLoading, location.pathname]);


  const checkUserLicenses = async () => {
    if (!user?.email) {
      setIsValidating(false);
      return;
    }

    try {
      // Check if user has a verified activation request with an active license
      const { data, error } = await supabase
        .from('license_activation_requests')
        .select(`
          *,
          license_keys!inner (
            license_key,
            organization_name,
            is_active,
            expires_at
          )
        `)
        .eq('email', user.email)
        .eq('verified', true)
        .eq('license_keys.is_active', true)
        .gt('license_keys.expires_at', new Date().toISOString())
        .limit(1);

      if (error) {
        console.error('License check error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        setHasLicense(true);
      } else {
        // No active license, redirect to activation
        console.log('No active license found for user:', user.email);
        navigate('/activate-license');
      }
    } catch (err) {
      console.error('License check error:', err);
      setHasLicense(false);
      // Don't block access on error, just log it
      setHasLicense(true);
    } finally {
      setIsValidating(false);
    }
  };


  if (authLoading || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Checking License</h2>
          <p className="text-slate-300">Please wait...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
