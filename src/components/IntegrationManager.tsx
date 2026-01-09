import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, CheckCircle } from 'lucide-react';
import ProcoreAuthButton from './ProcoreAuthButton';
import ProcoreProjectSelector from './ProcoreProjectSelector';
import ProcoreSyncManager from './ProcoreSyncManager';

export default function IntegrationManager() {
  const [connected, setConnected] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');

  const handleConnected = (token: string, company: string) => {
    setConnected(true);
    setAccessToken(token);
    setCompanyId(company);
  };

  const handleProjectSelected = (id: string, name: string) => {
    setProjectId(id);
    setProjectName(name);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Procore Integration
          </CardTitle>
          <CardDescription>Connect with Procore to sync estimates, photos, and project data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
              <div>
                <h3 className="font-semibold">Procore</h3>
                <p className="text-sm text-muted-foreground">
                  {connected ? `Connected${projectName ? ` - ${projectName}` : ''}` : 'Not connected'}
                </p>
              </div>
            </div>
            {connected && (
              <Badge variant="default" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </Badge>
            )}
          </div>

          {!connected && (
            <ProcoreAuthButton onConnected={handleConnected} />
          )}
        </CardContent>
      </Card>

      {connected && !projectId && (
        <ProcoreProjectSelector
          accessToken={accessToken}
          companyId={companyId}
          onProjectSelected={handleProjectSelected}
        />
      )}

      {connected && projectId && (
        <ProcoreSyncManager
          accessToken={accessToken}
          companyId={companyId}
          projectId={projectId}
        />
      )}
    </div>
  );
}
