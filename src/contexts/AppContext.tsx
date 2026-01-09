import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface Organization {
  id: string;
  name: string;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeOrganization: string | null; // null = "Personal"
  organizations: Organization[];
  setActiveOrganization: (orgId: string | null) => void;
  loadOrganizations: () => Promise<void>;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  activeOrganization: null,
  organizations: [],
  setActiveOrganization: () => {},
  loadOrganizations: async () => {},
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeOrganization, setActiveOrgState] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const loadOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(id, name)')
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (error) throw error;

      const orgs = data
        ?.map(m => m.organizations)
        .filter(Boolean)
        .map(org => ({ id: org.id, name: org.name })) || [];

      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const setActiveOrganization = (orgId: string | null) => {
    setActiveOrgState(orgId);
    localStorage.setItem('activeOrganization', orgId || 'personal');
  };

  useEffect(() => {
    if (user) {
      loadOrganizations();
      const saved = localStorage.getItem('activeOrganization');
      if (saved && saved !== 'personal') {
        setActiveOrgState(saved);
      }
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        activeOrganization,
        organizations,
        setActiveOrganization,
        loadOrganizations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

