import { ExtractionTrainingDashboard } from '@/components/ExtractionTrainingDashboard';
import { ContributionDashboard } from '@/components/ContributionDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExtractionTrainingPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">AI Extraction Training</h1>
        <p className="text-muted-foreground mt-2">
          Review AI extraction results and provide feedback to improve accuracy
        </p>
      </div>

      <Tabs defaultValue="training" className="space-y-6">
        <TabsList>
          <TabsTrigger value="training">Training Dashboard</TabsTrigger>
          <TabsTrigger value="contributions">My Contributions</TabsTrigger>
        </TabsList>

        <TabsContent value="training">
          <ExtractionTrainingDashboard />
        </TabsContent>

        <TabsContent value="contributions">
          <ContributionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

