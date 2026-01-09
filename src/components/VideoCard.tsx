import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Brain, ExternalLink, Database, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  isCached?: boolean;
  cacheHits?: number;
}

interface VideoCardProps {
  video: Video;
  onAnalyze: (forceReanalyze?: boolean) => void;
  isAnalyzing: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

export default function VideoCard({ video, onAnalyze, isAnalyzing, isSelected, onToggleSelect }: VideoCardProps) {
  return (
    <div className="space-y-2 relative">
      <div className="absolute top-2 left-2 z-10">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onToggleSelect}
          className="bg-white border-2"
        />
      </div>
      {video.isCached && (
        <Badge className="absolute top-2 right-2 z-10 bg-green-500 text-white flex items-center gap-1">
          <Database className="w-3 h-3" />
          Cached ({video.cacheHits || 0})
        </Badge>
      )}
      <div 
        className="group cursor-pointer" 
        onClick={() => window.open(`https://youtube.com/watch?v=${video.id}`, '_blank')}
      >
        <div className="relative overflow-hidden rounded-lg mb-2">
          <img 
            src={video.thumbnail} 
            alt={video.title} 
            className="w-full aspect-video object-cover group-hover:scale-105 transition-transform" 
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-white" />
          </div>
        </div>
        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-amber-500">{video.title}</h3>
        <p className="text-xs text-gray-500 mt-1">{video.channelTitle}</p>
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={(e) => { e.stopPropagation(); onAnalyze(false); }} 
          disabled={isAnalyzing} 
          variant="outline" 
          size="sm" 
          className="flex-1"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-3 h-3 mr-2" />
              {video.isCached ? 'View' : 'Analyze'}
            </>
          )}
        </Button>
        {video.isCached && (
          <Button 
            onClick={(e) => { e.stopPropagation(); onAnalyze(true); }} 
            disabled={isAnalyzing} 
            variant="ghost" 
            size="sm"
            title="Re-analyze video"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
