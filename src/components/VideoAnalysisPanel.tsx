import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Brain, Clock, BookOpen, Lightbulb, Wrench, Calculator, Network } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { toast } from 'sonner';


interface VideoAnalysis {
  id: string;
  key_concepts: string[];
  materials_mentioned: string[];
  techniques_described: string[];
  formulas_extracted: string[];
  best_practices: string[];
  transcript_summary: string;
  difficulty_level: string;
  estimated_learning_time: number;
  related_topics: string[];
  confidence_score: number;
}

interface Props {
  videoId: string;
}

export default function VideoAnalysisPanel({ videoId }: Props) {
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [buildingGraph, setBuildingGraph] = useState(false);


  useEffect(() => {
    loadAnalysis();
  }, [videoId]);

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('video_content_analysis')
        .select('*')
        .eq('video_id', videoId)
        .single();
      
      if (error) throw error;
      setAnalysis(data);
    } catch (err) {
      console.error('Error loading analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildKnowledgeGraph = async () => {
    setBuildingGraph(true);
    try {
      const content = {
        key_concepts: analysis?.key_concepts || [],
        materials: analysis?.materials_mentioned || [],
        techniques: analysis?.techniques_described || [],
        formulas: analysis?.formulas_extracted || [],
        best_practices: analysis?.best_practices || []
      };

      const { data, error } = await supabase.functions.invoke('build-knowledge-graph', {
        body: { sourceType: 'video', sourceId: videoId, content }
      });

      if (error) throw error;

      // Store nodes and edges in database
      const { analysis: graphData } = data;
      
      for (const concept of graphData.concepts) {
        const { data: node } = await supabase
          .from('knowledge_graph_nodes')
          .upsert({
            concept_name: concept.name,
            concept_type: concept.type,
            description: concept.description,
            importance_score: concept.importance
          }, { onConflict: 'concept_name' })
          .select()
          .single();

        if (node) {
          await supabase.from('knowledge_graph_sources').insert({
            node_id: node.id,
            source_type: 'video',
            source_id: videoId,
            context: analysis?.transcript_summary
          });
        }
      }

      toast.success('Knowledge graph updated successfully');
    } catch (error: any) {
      toast.error('Failed to build knowledge graph: ' + error.message);
    } finally {
      setBuildingGraph(false);
    }
  };

  if (loading || !analysis) return null;


  const difficultyColor = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  }[analysis.difficulty_level] || 'bg-gray-100 text-gray-800';

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          AI-Extracted Learning Content
        </CardTitle>
        <Button 
          onClick={buildKnowledgeGraph} 
          disabled={buildingGraph}
          size="sm"
          variant="outline"
        >
          <Network className="w-4 h-4 mr-2" />
          {buildingGraph ? 'Building...' : 'Add to Knowledge Graph'}
        </Button>

      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Badge className={difficultyColor}>
            {analysis.difficulty_level}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {analysis.estimated_learning_time} min
          </Badge>
        </div>

        {analysis.transcript_summary && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Summary
            </h4>
            <p className="text-sm text-gray-600">{analysis.transcript_summary}</p>
          </div>
        )}

        {analysis.key_concepts?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Key Concepts</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.key_concepts.map((concept, i) => (
                <Badge key={i} variant="secondary">{concept}</Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.materials_mentioned?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Materials
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.materials_mentioned.map((material, i) => (
                <Badge key={i} variant="outline">{material}</Badge>
              ))}
            </div>
          </div>
        )}

        {analysis.techniques_described?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Techniques
            </h4>
            <ul className="text-sm space-y-1">
              {analysis.techniques_described.map((tech, i) => (
                <li key={i} className="text-gray-600">• {tech}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.formulas_extracted?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Formulas
            </h4>
            <ul className="text-sm space-y-1">
              {analysis.formulas_extracted.map((formula, i) => (
                <li key={i} className="font-mono text-xs bg-gray-50 p-2 rounded">{formula}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.best_practices?.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Best Practices</h4>
            <ul className="text-sm space-y-1">
              {analysis.best_practices.map((practice, i) => (
                <li key={i} className="text-gray-600">✓ {practice}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
