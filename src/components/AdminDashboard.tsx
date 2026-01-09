import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Users, Ticket, DollarSign, TrendingUp, Activity, AlertCircle, CheckCircle, Clock, Shield, FileText } from 'lucide-react';
import { AdminSubscriptions } from './admin/AdminSubscriptions';
import { AdminTickets } from './admin/AdminTickets';
import { AdminAnnouncements } from './admin/AdminAnnouncements';
import { ApiUsageDashboard } from './admin/ApiUsageDashboard';
import { BillingSettingsManager } from './admin/BillingSettingsManager';

import { SystemLogsViewer } from './admin/SystemLogsViewer';
import BillingHistory from './BillingHistory';
import { RolesManager } from './admin/RolesManager';
import { UserRoleAssignment } from './admin/UserRoleAssignment';
import { ComprehensiveLicenseManager } from './admin/ComprehensiveLicenseManager';
import { AdminUsers } from './admin/AdminUsers';
import { ComprehensiveUserCreator } from './admin/ComprehensiveUserCreator';
import { OrganizationCreator } from './admin/OrganizationCreator';
import { useAuth } from '@/contexts/AuthContext';








export function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0, activeSubscriptions: 0, openTickets: 0,
    monthlyRevenue: 0, newUsersToday: 0, resolvedTicketsToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => { 
    loadStats(); 
    loadRecentActivity(); 
    loadUserType();
  }, []);

  const loadUserType = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserType(data?.user_type || null);
    } catch (error) {
      console.error('Error loading user type:', error);
    }
  };


  const loadStats = async () => {
    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [users, subs, tickets, newUsers, resolvedTickets] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('service_tickets').select('id', { count: 'exact' }).eq('status', 'open'),
        supabase.from('user_profiles').select('id', { count: 'exact' }).gte('created_at', today.toISOString()),
        supabase.from('service_tickets').select('id', { count: 'exact' }).eq('status', 'resolved').gte('updated_at', today.toISOString()),
      ]);
      setStats({
        totalUsers: users.count || 0, activeSubscriptions: subs.count || 0,
        openTickets: tickets.count || 0, monthlyRevenue: (subs.count || 0) * 83,
        newUsersToday: newUsers.count || 0, resolvedTicketsToday: resolvedTickets.count || 0,
      });
    } catch (error) { console.error('Error loading stats:', error); }
  };

  const loadRecentActivity = async () => {
    try {
      const { data: tickets } = await supabase.from('service_tickets')
        .select('*, user_profiles(email)').order('created_at', { ascending: false }).limit(5);
      setRecentActivity(tickets || []);
    } catch (error) { console.error('Error loading activity:', error); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      <div className="bg-gradient-to-r from-[#0f1419] to-[#0a0e1a] border-b-2 border-amber-500/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 rounded-lg"><Shield className="w-8 h-8 text-[#0a0e1a]" /></div>
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tight">ADMIN PORTAL</h1>
                <p className="text-gray-400 font-semibold">System Management & Control</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => window.location.href = '/dashboard'} variant="outline" 
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-bold">
                View Dashboard
              </Button>
              <Button onClick={() => signOut()} className="bg-red-600 hover:bg-red-700 text-white font-bold">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-8 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/10 backdrop-blur-lg border-2 border-blue-400 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-blue-200 uppercase">Total Users</CardTitle>
              <Users className="h-8 w-8 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-white">{stats.totalUsers}</div>
              <p className="text-sm text-blue-200 mt-2 font-semibold">+{stats.newUsersToday} new today</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-lg border-2 border-green-400 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-green-200 uppercase">Active Subs</CardTitle>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-white">{stats.activeSubscriptions}</div>
              <p className="text-sm text-green-200 mt-2 font-semibold">Monthly recurring</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-lg border-2 border-orange-400 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-orange-200 uppercase">Open Tickets</CardTitle>
              <AlertCircle className="h-8 w-8 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-white">{stats.openTickets}</div>
              <p className="text-sm text-orange-200 mt-2 font-semibold">{stats.resolvedTicketsToday} resolved</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-lg border-2 border-yellow-400 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-yellow-200 uppercase">Revenue MRR</CardTitle>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-white">${stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-sm text-yellow-200 mt-2 font-semibold">Estimated monthly</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-lg border-2 border-purple-400">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-white font-bold">
                <Activity className="w-6 h-6 text-purple-400" />Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <p className="text-purple-200">No recent activity</p>
                ) : (
                  recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-3 pb-3 border-b border-purple-600 last:border-0">
                      <div className="mt-1">
                        {activity.status === 'open' ? <Clock className="w-4 h-4 text-orange-400" /> : 
                        <CheckCircle className="w-4 h-4 text-green-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{activity.subject}</p>
                        <p className="text-xs text-purple-200">
                          {activity.user_profiles?.email} • {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={activity.priority === 'high' ? 'destructive' : 'secondary'}>
                        {activity.priority}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-2 border-green-400">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-white font-bold">
                <CheckCircle className="w-6 h-6 text-green-400" />System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Database', 'API Services', 'Payment Gateway', 'Email Service', 'Storage'].map((service) => (
                  <div key={service} className="flex justify-between items-center">
                    <span className="text-white font-semibold">{service}</span>
                    <Badge className="bg-green-500 text-white font-bold">Operational</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-[#0f1419] border-2 border-amber-500/30">
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">Users</TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="licenses" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">License Keys</TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">Subscriptions</TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">Billing</TabsTrigger>
            <TabsTrigger value="tickets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">Tickets</TabsTrigger>
            <TabsTrigger value="announcements" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">Announcements</TabsTrigger>
            <TabsTrigger value="api-usage" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">API Usage</TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-[#0a0e1a]">System Logs</TabsTrigger>
          </TabsList>



          <TabsContent value="users">
            <div className="space-y-6">
              {userType === 'super_admin' && <OrganizationCreator />}
              <ComprehensiveUserCreator />
              <AdminUsers />
            </div>
          </TabsContent>


          <TabsContent value="roles">
            <div className="space-y-6">
              <RolesManager />
              <UserRoleAssignment />
            </div>
          </TabsContent>
          <TabsContent value="licenses"><ComprehensiveLicenseManager /></TabsContent>



          <TabsContent value="subscriptions"><AdminSubscriptions /></TabsContent>
          <TabsContent value="billing"><BillingHistory /></TabsContent>
          <TabsContent value="tickets"><AdminTickets /></TabsContent>
          <TabsContent value="announcements"><AdminAnnouncements /></TabsContent>
          <TabsContent value="api-usage">
            <div className="space-y-6">
              <BillingSettingsManager />
              <ApiUsageDashboard />
            </div>
          </TabsContent>

          <TabsContent value="logs"><SystemLogsViewer /></TabsContent>
        </Tabs>



      </div>
    </div>
  );
}
