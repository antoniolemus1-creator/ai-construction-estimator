import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, Edit, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useState } from 'react';

interface VideoAnalysisModalProps {
  video: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function VideoAnalysisModal({ video, isOpen, onClose, onRefresh }: VideoAnalysisModalProps) {
  const analysis = video?.analysis_results || {};

  // Removed re-analyze functionality - all video analysis happens in Training Videos tab

  const handleDelete = async () => {
    if (!confirm('Delete this analysis?')) return;
    try {
      await supabase.from('analyzed_videos').delete().eq('id', video.id);
      toast.success('Analysis deleted');
      onClose();
      onRefresh();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{video?.video_title}</span>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${video?.video_id}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>

          <Tabs defaultValue="concepts" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="concepts">Concepts</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="techniques">Techniques</TabsTrigger>
              <TabsTrigger value="practices">Best Practices</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>

            <TabsContent value="concepts">
              <Card>
                <CardHeader>
                  <CardTitle>Key Concepts ({analysis.keyConcepts?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.keyConcepts?.map((c: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{c.name}</h4>
                        <Badge>{(c.confidence * 100).toFixed(0)}%</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materials">
              <Card>
                <CardHeader>
                  <CardTitle>Materials Mentioned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.materialsMentioned?.map((m: string, i: number) => (
                      <Badge key={i} variant="secondary">{m}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="techniques">
              <Card>
                <CardHeader>
                  <CardTitle>Techniques Described</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.techniquesDescribed?.map((t: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span className="text-sm">{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="practices">
              <Card>
                <CardHeader>
                  <CardTitle>Best Practices</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.bestPractices?.map((p: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-sm">{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions">
              <Card>
                <CardHeader>
                  <CardTitle>AI-Generated Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.suggestedQuestions?.map((q: string, i: number) => (
                      <div key={i} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Q{i + 1}: {q}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}