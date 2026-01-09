import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeGraphVisualization } from './KnowledgeGraphVisualization';
import { supabase } from '@/lib/supabase';
import { Search, Video, BookOpen, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export function KnowledgeGraphExplorer() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKnowledgeGraph();
  }, []);

  const loadKnowledgeGraph = async () => {
    try {
      const { data: nodesData } = await supabase
        .from('knowledge_graph_nodes')
        .select('*')
        .order('importance_score', { ascending: false });

      const { data: edgesData } = await supabase
        .from('knowledge_graph_edges')
        .select('*');

      setNodes(nodesData || []);
      setEdges(edgesData || []);
    } catch (error) {
      toast.error('Failed to load knowledge graph');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = async (node: any) => {
    setSelectedNode(node.id);
    
    // Find related videos
    const { data: sources } = await supabase
      .from('knowledge_graph_sources')
      .select('source_id, source_type, context')
      .eq('node_id', node.id)
      .eq('source_type', 'video');

    setRelatedVideos(sources || []);

    // Get connected nodes for recommendations
    const connectedEdges = edges.filter(e => e.source_node_id === node.id || e.target_node_id === node.id);
    const connectedNodeIds = connectedEdges.map(e => 
      e.source_node_id === node.id ? e.target_node_id : e.source_node_id
    );
    const connectedNodes = nodes.filter(n => connectedNodeIds.includes(n.id));
    setRecommendations(connectedNodes);
  };

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.concept_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || node.concept_type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredEdges = edges.filter(edge => {
    const sourceVisible = filteredNodes.some(n => n.id === edge.source_node_id);
    const targetVisible = filteredNodes.some(n => n.id === edge.target_node_id);
    return sourceVisible && targetVisible;
  });

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  const typeColors: Record<string, string> = {
    material: 'bg-blue-500',
    technique: 'bg-green-500',
    formula: 'bg-amber-500',
    best_practice: 'bg-purple-500',
    tool: 'bg-red-500',
    measurement: 'bg-cyan-500'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading knowledge graph...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            AI Knowledge Graph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">No Knowledge Graph Data Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Start analyzing training videos to build your AI knowledge graph. 
                Go to the Training tab and click "Analyze for AI Learning" on any video.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            AI Knowledge Graph ({nodes.length} concepts)
          </CardTitle>
        </CardHeader>
        <CardContent>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {['material', 'technique', 'formula', 'best_practice', 'tool', 'measurement'].map(type => (
                  <Badge
                    key={type}
                    variant={filterType === type ? 'default' : 'outline'}
                    className={`cursor-pointer ${filterType === type ? typeColors[type] : ''}`}
                    onClick={() => setFilterType(filterType === type ? null : type)}
                  >
                    {type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <KnowledgeGraphVisualization
              nodes={filteredNodes.map(n => ({
                id: n.id,
                name: n.concept_name,
                type: n.concept_type,
                importance: n.importance_score
              }))}
              edges={filteredEdges.map(e => ({
                source: e.source_node_id,
                target: e.target_node_id,
                type: e.relationship_type,
                strength: e.strength
              }))}
              onNodeClick={handleNodeClick}
              selectedNode={selectedNode}
            />

            {selectedNodeData && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge className={typeColors[selectedNodeData.concept_type]}>
                      {selectedNodeData.concept_type}
                    </Badge>
                    {selectedNodeData.concept_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="videos">Related Videos ({relatedVideos.length})</TabsTrigger>
                      <TabsTrigger value="related">Related Concepts ({recommendations.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-2">
                      <p className="text-sm text-muted-foreground">{selectedNodeData.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Importance:</span>
                        <Badge variant="secondary">{selectedNodeData.importance_score}/10</Badge>
                      </div>
                    </TabsContent>
                    <TabsContent value="videos" className="space-y-2">
                      {relatedVideos.map((video, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 border rounded">
                          <Video className="w-4 h-4" />
                          <span className="text-sm">{video.context}</span>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="related" className="space-y-2">
                      {recommendations.map(node => (
                        <Button
                          key={node.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleNodeClick(node)}
                        >
                          <Badge className={`mr-2 ${typeColors[node.concept_type]}`}>
                            {node.concept_type}
                          </Badge>
                          {node.concept_name}
                        </Button>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default KnowledgeGraphExplorer;
