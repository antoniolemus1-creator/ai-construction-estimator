import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, Plus, Youtube, Brain, Sparkles, Link as LinkIcon, Trash2, History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard';
import CacheStatisticsCard from './CacheStatisticsCard';



interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  isCached?: boolean;
  cacheHits?: number;
}


export default function YouTubeTrainingVideos() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<Video[]>([]);
  const [customVideos, setCustomVideos] = useState<Video[]>([]);
  const [analyzedVideos, setAnalyzedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingVideo, setAnalyzingVideo] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadVideos();
    loadCustomVideos();
    loadAnalyzedVideos();
  }, [user]);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const addCustomVideo = async () => {
    if (!videoUrl.trim()) return;
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      return;
    }
    setAddingVideo(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-video', {
        body: { videoId }
      });
      if (error) throw error;
      
      if (user) {
        await supabase.from('custom_training_videos').insert({
          user_id: user.id,
          video_id: videoId,
          title: data.title,
          description: data.description,
          thumbnail_url: data.thumbnailUrl,
          channel_title: data.channelTitle,
          published_at: data.publishedAt
        });
      }
      await loadCustomVideos();
      setVideoUrl('');
      toast.success('Video added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add video');
    } finally {
      setAddingVideo(false);
    }
  };

  const loadCustomVideos = async () => {
    if (!user) return;
    const { data } = await supabase.from('custom_training_videos').select('*').eq('user_id', user.id);
    
    // Get analyzed videos to filter custom videos too
    const { data: analyzedData } = await supabase
      .from('analyzed_videos')
      .select('video_id')
      .eq('user_id', user.id);
    
    const analyzedSet = new Set(analyzedData?.map(a => a.video_id) || []);
    
    if (data) {
      const unanalyzedCustom = data.filter(v => !analyzedSet.has(v.video_id));
      setCustomVideos(unanalyzedCustom.map(v => ({
        id: v.video_id,
        title: v.title,
        description: v.description || '',
        thumbnail: v.thumbnail_url,
        channelTitle: v.channel_title
      })));
    }
  };


  const loadAnalyzedVideos = async () => {
    if (!user) return;
    const { data } = await supabase.from('analyzed_videos').select('*').eq('user_id', user.id);
    if (data) setAnalyzedVideos(data);
  };

  const removeFromAnalyzed = async (videoId: string) => {
    if (!user) return;
    await supabase.from('analyzed_videos').delete().eq('user_id', user.id).eq('video_id', videoId);
    await loadAnalyzedVideos();
    await loadVideos(); // Refresh to show video back in queue
    await loadCustomVideos(); // Refresh custom videos too
    toast.success('Removed from analyzed - video restored to queue');
  };


  const loadVideos = async () => {
    const { data } = await supabase.functions.invoke('fetch-youtube-training');
    if (data?.videos) {
      // Check cache status and analyzed status for each video
      const { data: cacheData } = await supabase
        .from('video_analysis_cache')
        .select('video_id, cache_hits')
        .gt('expires_at', new Date().toISOString());
      
      const { data: analyzedData } = user ? await supabase
        .from('analyzed_videos')
        .select('video_id')
        .eq('user_id', user.id) : { data: null };
      
      const cacheMap = new Map(cacheData?.map(c => [c.video_id, c.cache_hits]) || []);
      const analyzedSet = new Set(analyzedData?.map(a => a.video_id) || []);
      
      // Filter out already analyzed videos
      const unanalyzedVideos = data.videos.filter((v: Video) => !analyzedSet.has(v.id));
      
      setVideos(unanalyzedVideos.map((v: Video) => ({
        ...v,
        isCached: cacheMap.has(v.id),
        cacheHits: cacheMap.get(v.id) || 0
      })));
      
      // Show notification if videos were filtered
      if (analyzedSet.size > 0 && data.videos.length > unanalyzedVideos.length) {
        toast.info(`${data.videos.length - unanalyzedVideos.length} already analyzed video(s) hidden from queue`);
      }
    }
    setLoading(false);
  };


  const analyzeVideo = async (video: Video, forceReanalyze = false) => {
    if (!user) {
      toast.error('Please sign in to analyze videos');
      return;
    }
    
    if (analyzingVideo) {
      toast.warning('Please wait for current analysis to complete');
      return;
    }
    
    setAnalyzingVideo(video.id);
    try {
      const requestBody = { 
        videoId: video.id, 
        videoTitle: video.title, 
        videoDescription: video.description, 
        userId: user.id,
        thumbnailUrl: video.thumbnail,
        forceReanalyze
      };
      
      const { data, error } = await supabase.functions.invoke('analyze-video-content', {
        body: requestBody
      });
      
      if (error) throw new Error(error.message || 'Edge function invocation failed');
      if (!data) throw new Error('No response data received');
      if (data.success === false) throw new Error(data.error || 'Analysis failed');
      
      await loadAnalyzedVideos();
      await loadVideos(); // Refresh cache status
      
      if (data.fromCache) {
        toast.success(`✓ Loaded from cache! (${data.cacheHits} hits)`, {
          description: `Saved ${data.tokensSaved} tokens ($${data.costSaved?.toFixed(4)})`
        });
      } else {
        toast.success(`✓ Video analyzed! Found ${data.analysis?.keyConcepts?.length || 0} concepts`, {
          description: `Tokens: ${data.tokensUsed} | Cost: $${data.estimatedCost?.toFixed(4)}`
        });
      }
    } catch (err: any) {
      let errorMessage = 'Failed to analyze video';
      let errorDescription = '';
      
      if (err.message?.includes('Rate limit')) {
        errorMessage = 'Too many requests';
        errorDescription = 'Wait 5-10 seconds before analyzing another video.';
      } else if (err.message?.includes('quota')) {
        errorMessage = 'API Quota Exceeded';
        errorDescription = 'OpenAI usage limit reached. Contact support.';
      } else {
        errorMessage = err.message;
        errorDescription = 'Check console for details.';
      }
      
      toast.error(errorMessage, { description: errorDescription, duration: 6000 });
    } finally {
      setAnalyzingVideo(null);
    }
  };







  const analyzeBulk = async () => {
    if (!user || selectedVideos.length === 0) return;
    
    if (selectedVideos.length > 10) {
      toast.warning('Bulk analysis limited to 10 videos at a time to prevent rate limiting');
      return;
    }
    
    setBulkAnalyzing(true);
    setBulkProgress({ current: 0, total: selectedVideos.length });
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < selectedVideos.length; i++) {
      const videoId = selectedVideos[i];
      const video = [...videos, ...customVideos].find(v => v.id === videoId);
      if (!video) continue;
      
      try {
        console.log(`Analyzing video ${i + 1}/${selectedVideos.length}: ${video.title}`);
        
        const { data, error } = await supabase.functions.invoke('analyze-video-content', {
          body: { 
            videoId: video.id, 
            videoTitle: video.title, 
            videoDescription: video.description, 
            userId: user.id,
            thumbnailUrl: video.thumbnail
          }
        });
        
        if (error || !data || data.success === false) {
          throw new Error(error?.message || data?.error || 'Analysis failed');
        }
        
        successCount++;
        setBulkProgress({ current: i + 1, total: selectedVideos.length });
        
        // Add 5 second delay between analyses to prevent rate limiting
        if (i < selectedVideos.length - 1) {
          toast.info(`Waiting 5 seconds before next video... (${i + 1}/${selectedVideos.length} complete)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (err: any) {
        console.error(`Failed to analyze video ${video.title}:`, err);
        failCount++;
        toast.error(`Failed: ${video.title}`, {
          description: err.message || 'Unknown error'
        });
      }
    }
    
    await loadAnalyzedVideos();
    setSelectedVideos([]);
    setBulkAnalyzing(false);
    
    if (successCount > 0) {
      toast.success(`✓ Successfully analyzed ${successCount} video${successCount > 1 ? 's' : ''}`, {
        description: failCount > 0 ? `${failCount} failed` : undefined
      });
    } else {
      toast.error('All analyses failed. Please check the errors above.');
    }
  };



  const toggleSelection = (videoId: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const selectAll = () => {
    const allIds = [...videos, ...customVideos].map(v => v.id);
    setSelectedVideos(allIds);
  };

  const deselectAll = () => setSelectedVideos([]);

  const allVideos = [...customVideos, ...videos];

  if (loading) return <Card><CardContent className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></CardContent></Card>;

  return (
    <div className="space-y-6">
      <CacheStatisticsCard />
      
      <Card className="border-2 border-dashed border-amber-300">
        <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Add Training Video</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Paste YouTube URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
            <Button onClick={addCustomVideo} disabled={addingVideo}>{addingVideo ? 'Adding...' : 'Add'}</Button>
          </div>
        </CardContent>
      </Card>

      {analyzedVideos.length > 0 && (
        <Card className="border-green-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Analyzed ({analyzedVideos.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/analysis-history')}>
                <History className="w-4 h-4 mr-2" />
                View Full History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {analyzedVideos.slice(0, 5).map(av => (
              <div key={av.id} className="flex justify-between p-2 border-b">
                <span className="text-sm">{av.video_title}</span>
                <Button variant="ghost" size="sm" onClick={() => removeFromAnalyzed(av.video_id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {analyzedVideos.length > 5 && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                + {analyzedVideos.length - 5} more videos
              </p>
            )}
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Training Videos ({allVideos.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectedVideos.length === allVideos.length ? deselectAll : selectAll}>
                {selectedVideos.length === allVideos.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button onClick={analyzeBulk} disabled={selectedVideos.length === 0 || bulkAnalyzing}>
                {bulkAnalyzing ? `Analyzing ${bulkProgress.current}/${bulkProgress.total}` : `Analyze Selected (${selectedVideos.length})`}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allVideos.map(v => (
              <VideoCard 
                key={v.id} 
                video={v} 
                onAnalyze={(forceReanalyze) => analyzeVideo(v, forceReanalyze)} 
                isAnalyzing={analyzingVideo === v.id}
                isSelected={selectedVideos.includes(v.id)}
                onToggleSelect={() => toggleSelection(v.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
