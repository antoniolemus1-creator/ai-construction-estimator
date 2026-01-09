import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProposalTemplatesLibrary } from '@/components/ProposalTemplatesLibrary';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { useEffect } from 'react';

export default function ProposalTemplatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      <nav className="border-b border-amber-900/20 bg-[#0a0e1a]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/dashboard')} variant="ghost" className="text-amber-400 hover:bg-amber-500/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Proposal Templates</h1>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <SubscriptionGuard featureName="Proposal Templates" requiredTier="pro">
          <ProposalTemplatesLibrary />
        </SubscriptionGuard>
      </div>
    </div>
  );
}
