import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
import { Video, ExternalLink } from 'lucide-react';

interface Props {
  currentConcepts: string[];
}

export function ConceptRecommendations({ currentConcepts }: Props) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentConcepts.length > 0) {
      loadRecommendations();
    }
  }, [currentConcepts]);

  const loadRecommendations = async () => {
    try {
      // Find nodes matching current concepts
      const { data: nodes } = await supabase
        .from('knowledge_graph_nodes')
        .select('id, concept_name, concept_type')
        .in('concept_name', currentConcepts);

      if (!nodes || nodes.length === 0) return;

      // Get related videos for these nodes
      const nodeIds = nodes.map(n => n.id);
      const { data: sources } = await supabase
        .from('knowledge_graph_sources')
        .select('source_id, node_id, context')
        .eq('source_type', 'video')
        .in('node_id', nodeIds);

      setRecommendations(sources || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Recommended Training Videos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Based on your current work with: {currentConcepts.join(', ')}
        </p>
        {recommendations.slice(0, 5).map((rec, i) => (
          <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium">{rec.context}</p>
              <Badge variant="secondary" className="mt-1">Related Concept</Badge>
            </div>
            <Button size="sm" variant="outline">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
