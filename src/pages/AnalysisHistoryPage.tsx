import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, RefreshCw, Calendar, TrendingUp, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import VideoTranscriptSearch from '@/components/VideoTranscriptSearch';


interface AnalyzedVideo {
  id: string;
  video_id: string;
  video_title: string;
  thumbnail_url: string;
  analyzed_at: string;
  concepts_count: number;
  analysis_results: any;
  transcript?: string;
  transcript_timestamps?: any;
}

export default function AnalysisHistoryPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<AnalyzedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<AnalyzedVideo | null>(null);
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);


  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('analyzed_videos')
      .select('*')
      .eq('user_id', user.id)
      .order('analyzed_at', { ascending: false });
    if (data) setVideos(data);
    setLoading(false);
  };

  const reanalyzeVideo = async (video: AnalyzedVideo) => {
    setReanalyzing(video.id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-video-content', {
        body: {
          videoId: video.video_id,
          videoTitle: video.video_title,
          videoDescription: '',
          userId: user?.id,
          thumbnailUrl: video.thumbnail_url
        }
      });
      if (error) throw error;
      toast.success('Video re-analyzed successfully');
      loadHistory();
    } catch (error: any) {
      toast.error('Failed to re-analyze: ' + error.message);
    }
    setReanalyzing(null);
  };

  const deleteVideo = async (id: string) => {
    await supabase.from('analyzed_videos').delete().eq('id', id);
    toast.success('Analysis deleted');
    loadHistory();
  };

  const searchTranscripts = async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase
      .from('analyzed_videos')
      .select('*')
      .eq('user_id', user.id)
      .textSearch('transcript', searchQuery);
    
    if (data) {
      const results = data.map(video => {
        const matches: any[] = [];
        if (video.transcript && video.transcript_timestamps) {
          const sentences = video.transcript.split(/[.!?]+/);
          sentences.forEach((sentence: string, idx: number) => {
            if (sentence.toLowerCase().includes(searchQuery.toLowerCase())) {
              const timestamp = video.transcript_timestamps[idx] || idx * 10;
              matches.push({
                text: sentence.trim(),
                timestamp,
                formattedTime: new Date(timestamp * 1000).toISOString().substr(11, 8)
              });
            }
          });
        }
        return {
          videoId: video.video_id,
          videoTitle: video.video_title,
          thumbnailUrl: video.thumbnail_url,
          matches
        };
      }).filter(r => r.matches.length > 0);
      setSearchResults(results);
    }
    setSearching(false);
  };

  const handleTimestampClick = (videoId: string, timestamp: number) => {
    window.open(`https://youtube.com/watch?v=${videoId}&t=${Math.floor(timestamp)}s`, '_blank');
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Analysis History</h1>
        <p className="text-muted-foreground">View all analyzed videos and their extracted insights</p>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search video transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchTranscripts()}
              className="pl-9"
            />
          </div>
          <Button onClick={searchTranscripts} disabled={searching || !searchQuery.trim()}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
          {searchResults.length > 0 && (
            <Button variant="outline" onClick={() => { setSearchResults([]); setSearchQuery(''); }}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {searchResults.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Search Results ({searchResults.length})</h2>
          <VideoTranscriptSearch 
            results={searchResults}
            onTimestampClick={handleTimestampClick}
            searchQuery={searchQuery}
          />
        </div>
      )}


      {videos.length === 0 ? (
        <Card className="p-12 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Analysis History</h3>
          <p className="text-muted-foreground">Analyze some videos to see them here</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                alt={video.video_title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold mb-2 line-clamp-2">{video.video_title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(video.analyzed_at), 'MMM d, yyyy')}
                </div>
                <Badge variant="secondary" className="mb-4">
                  {video.concepts_count || 0} Concepts
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedVideo(video)} className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => reanalyzeVideo(video)}
                    disabled={reanalyzing === video.id}
                  >
                    {reanalyzing === video.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteVideo(video.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.video_title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {selectedVideo?.analysis_results && (
              <div className="space-y-4 pr-4">
                {selectedVideo.analysis_results.keyConcepts && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Concepts</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.analysis_results.keyConcepts.map((c: any, i: number) => (
                        <Badge key={i}>{typeof c === 'string' ? c : c.name}</Badge>
                      ))}

                    </div>
                  </div>
                )}
                {selectedVideo.analysis_results.materialsMentioned && (
                  <div>
                    <h4 className="font-semibold mb-2">Materials</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedVideo.analysis_results.materialsMentioned.map((m: string, i: number) => (
                        <Badge key={i} variant="secondary">{m}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedVideo.analysis_results.techniquesDescribed && (
                  <div>
                    <h4 className="font-semibold mb-2">Techniques</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {selectedVideo.analysis_results.techniquesDescribed.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedVideo.analysis_results.transcriptSummary && (
                  <div>
                    <h4 className="font-semibold mb-2">Summary</h4>
                    <p className="text-sm text-muted-foreground">{selectedVideo.analysis_results.transcriptSummary}</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
