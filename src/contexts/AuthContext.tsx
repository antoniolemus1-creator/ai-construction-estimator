import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SubscriptionInfo {
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  user_type?: string;
}


interface AuthContextType {
  user: User | null;
  loading: boolean;
  subscription: SubscriptionInfo | null;
  hasActiveSubscription: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSubscription(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadSubscription(session.user.id);
      } else {
        setSubscription(null);
      }
    });

    return () => authSub.unsubscribe();
  }, []);

  const loadSubscription = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status, trial_ends_at, user_type')
        .eq('id', userId)
        .maybeSingle();
      
      if (data) {
        setSubscription(data);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    }
  };



  const refreshSubscription = async () => {
    if (user) {
      await loadSubscription(user.id);
    }
  };

  const hasActiveSubscription = () => {
    if (!subscription) return false;
    const isActive = subscription.subscription_status === 'active';
    const isTrial = subscription.subscription_status === 'trial' && 
      subscription.trial_ends_at && 
      new Date(subscription.trial_ends_at) > new Date();
    return isActive || isTrial;
  };


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Log successful sign in
    await supabase.functions.invoke('log-event', {
      body: {
        userEmail: email,
        eventType: 'auth',
        severity: 'success',
        action: 'User Sign In',
        description: 'User successfully signed in'
      }
    });
  };


  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        full_name: fullName
      });
      
      // Log new user registration
      await supabase.functions.invoke('log-event', {
        body: {
          userId: data.user.id,
          userEmail: email,
          eventType: 'auth',
          severity: 'success',
          action: 'User Registration',
          description: 'New user account created'
        }
      });
    }
  };


  const signOut = async () => {
    const currentUser = user;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Log sign out
    if (currentUser) {
      await supabase.functions.invoke('log-event', {
        body: {
          userId: currentUser.id,
          userEmail: currentUser.email,
          eventType: 'auth',
          severity: 'info',
          action: 'User Sign Out',
          description: 'User signed out'
        }
      });
    }
  };


  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      subscription,
      hasActiveSubscription: hasActiveSubscription(),
      signIn, 
      signUp, 
      signOut,
      refreshSubscription 
    }}>
      {children}
    </AuthContext.Provider>
  );
}



export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
