import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import YouTubeTrainingVideos from '@/components/YouTubeTrainingVideos';
import VideoAnalysisDashboard from './VideoAnalysisDashboard';
import AILearningInsights from '@/components/AILearningInsights';
import KnowledgeGraphExplorer from '@/components/KnowledgeGraphExplorer';
import VideoAnalysisDiagnostics from '@/components/VideoAnalysisDiagnostics';
import OpenAIConnectionTest from '@/components/OpenAIConnectionTest';
import { FunctionMonitoringDashboard } from '@/components/FunctionMonitoringDashboard';
import { Brain } from 'lucide-react';



export default function AILearningPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-10 h-10 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold">AI Learning System</h1>
          <p className="text-muted-foreground">Train AI with YouTube videos and track learning progress</p>
        </div>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="videos">Training Videos</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          <YouTubeTrainingVideos />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <VideoAnalysisDashboard />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <AILearningInsights />
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6">
          <KnowledgeGraphExplorer />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <FunctionMonitoringDashboard />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <OpenAIConnectionTest />
          <VideoAnalysisDiagnostics />
        </TabsContent>

      </Tabs>
    </div>
  );
}
