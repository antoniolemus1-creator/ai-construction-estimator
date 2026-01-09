import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain } from 'lucide-react';
import TrainingWorkflow from '@/components/TrainingWorkflow';
import AIStatusIndicator from '@/components/AIStatusIndicator';
import YouTubeTrainingVideos from '@/components/YouTubeTrainingVideos';
import { KnowledgeGraphExplorer } from '@/components/KnowledgeGraphExplorer';
import { Card, CardContent } from '@/components/ui/card';
import OpenAITestButton from '@/components/OpenAITestButton';


import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import { useEffect } from 'react';


export default function TrainingPage() {
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">AI Training Pipeline</h1>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <SubscriptionGuard featureName="AI Training Pipeline" requiredTier="pro">
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-all" onClick={() => navigate('/ai-learning')}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Brain className="w-12 h-12 text-purple-400" />
                  <div>
                    <h3 className="text-xl font-bold text-purple-300">AI Learning Insights</h3>
                    <p className="text-sm text-muted-foreground">See how AI is learning, answer questions, and clarify concepts</p>
                  </div>
                  <Button className="ml-auto">View Dashboard</Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TrainingWorkflow />
              </div>
              <div className="space-y-6">
                <AIStatusIndicator />
                <OpenAITestButton />
              </div>
            </div>

            <YouTubeTrainingVideos />
            <KnowledgeGraphExplorer />

          </div>
        </SubscriptionGuard>
      </div>
    </div>
  );
}
