import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationSettings } from '@/components/organization/OrganizationSettings';
import { TeamManagement } from '@/components/organization/TeamManagement';
import { CreateOrganizationModal } from '@/components/organization/CreateOrganizationModal';
import { Button } from '@/components/ui/button';
import { Building2, Users, Settings } from 'lucide-react';

export default function OrganizationPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Organization Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization settings and team members
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Building2 className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent value="team">
          <TeamManagement />
        </TabsContent>
      </Tabs>

      <CreateOrganizationModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}