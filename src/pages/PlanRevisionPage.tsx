import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanRevisionUploader } from '@/components/PlanRevisionUploader';
import { PlanRevisionComparison } from '@/components/PlanRevisionComparison';
import { PlanViewer } from '@/components/PlanViewer';
import { supabase } from '@/lib/supabase';
import { FileText, GitCompare, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
export default function PlanRevisionPage() {
  const [planId, setPlanId] = useState<string>('');
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<any | null>(null);


  useEffect(() => {
    initializePlan();
  }, []);

  const initializePlan = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create a default plan
      let { data: plans } = await supabase
        .from('plans')

        .select('*')
        .eq('user_id', user.id)
        .limit(1);

      if (!plans || plans.length === 0) {
        const { data: newPlan } = await supabase
          .from('plans')

          .insert({
            user_id: user.id,
            project_name: 'My Construction Project',
            status: 'active'
          })
          .select()
          .single();
        
        setPlanId(newPlan.id);
      } else {
        setPlanId(plans[0].id);
        loadRevisions(plans[0].id);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRevisions = async (id: string) => {
    const { data, error } = await supabase
      .from('plan_revisions')
      .select('*')
      .eq('plan_id', id)
      .order('version_number', { ascending: true });


    if (error) {
      toast.error(error.message);
    } else {
      setRevisions(data || []);
    }
  };

  const handleRevisionsUploaded = (newRevisions: any[]) => {
    setRevisions([...revisions, ...newRevisions]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Plan Revision & Annotation</h1>
        <p className="text-muted-foreground">
          Upload plans, annotate with measurements and notes, and compare revisions with AI-powered analysis
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Upload Revisions
          </TabsTrigger>
          <TabsTrigger value="annotate" className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Annotate
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Compare
          </TabsTrigger>
        </TabsList>


        <TabsContent value="upload">
          <div className="grid gap-6">
            <PlanRevisionUploader 
              planId={planId} 
              onRevisionsUploaded={handleRevisionsUploaded}
            />

            {revisions.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Uploaded Revisions ({revisions.length})</h3>
                <div className="space-y-2">
                  {revisions.map((rev) => (
                    <div key={rev.id} className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <div>
                          <p className="font-medium">{rev.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(rev.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium">Rev {rev.version_number}</span>
                    </div>

                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="annotate">
          {revisions.length === 0 ? (
            <Card className="p-12 text-center">
              <Pencil className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No plans uploaded</h3>
              <p className="text-muted-foreground">
                Upload a plan revision first to start annotating
              </p>
            </Card>
          ) : !selectedRevision ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Select a Plan to Annotate</h3>
              <div className="space-y-2">
                {revisions.map((rev) => (
                  <Button
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Rev {rev.version_number} - {rev.file_name}
                  </Button>
                ))}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <div>
                      <h3 className="font-semibold">{selectedRevision.file_name}</h3>
                      <p className="text-sm text-muted-foreground">Rev {selectedRevision.version_number}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedRevision(null)}>
                    Change Plan
                  </Button>
                </div>
              </Card>
              <PlanViewer
                planRevisionId={selectedRevision.id}
                imageUrl={supabase.storage.from('construction-plans').getPublicUrl(selectedRevision.file_url).data.publicUrl}
              />
            </div>
          )}
        </TabsContent>


        <TabsContent value="compare">
          {revisions.length < 2 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Upload at least 2 revisions</h3>
              <p className="text-muted-foreground">
                You need to upload at least two plan revisions to compare them
              </p>
            </Card>
          ) : (
            <PlanRevisionComparison planId={planId} revisions={revisions} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}