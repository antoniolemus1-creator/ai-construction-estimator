import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign } from 'lucide-react';
import { CompanyUsersManager } from './CompanyUsersManager';
import { ApiUsageDashboard } from './ApiUsageDashboard';

export function UserAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Admin</h1>
        <p className="text-muted-foreground">Manage your company users and view API usage</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            API Usage & Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <CompanyUsersManager />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <ApiUsageDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
