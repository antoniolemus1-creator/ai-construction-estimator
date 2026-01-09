import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FineTuningJobManager } from '@/components/FineTuningJobManager';
import { ModelPerformanceComparison } from '@/components/ModelPerformanceComparison';
import { Sparkles, BarChart3 } from 'lucide-react';

export default function FineTuningPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          AI Model Fine-Tuning
        </h1>
        <p className="text-muted-foreground mt-2">
          Train custom GPT-4 models on your extraction feedback to improve accuracy
        </p>
      </div>

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Fine-Tuning Jobs</TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <FineTuningJobManager />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <ModelPerformanceComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}