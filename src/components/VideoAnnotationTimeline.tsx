import { VideoAnnotation } from '@/types/videoAnnotations';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MessageSquare, Pencil, MapPin, Mic, Star, ListChecks } from 'lucide-react';

interface VideoAnnotationTimelineProps {
  annotations: VideoAnnotation[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function VideoAnnotationTimeline({
  annotations,
  currentTime,
  duration,
  onSeek
}: VideoAnnotationTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'marker': return <MapPin className="w-3 h-3" />;
      case 'label': return <MessageSquare className="w-3 h-3" />;
      case 'drawing': return <Pencil className="w-3 h-3" />;
      case 'voice_note': return <Mic className="w-3 h-3" />;
      case 'highlight': return <Star className="w-3 h-3" />;
      case 'workflow_step': return <ListChecks className="w-3 h-3" />;
      default: return <MapPin className="w-3 h-3" />;
    }
  };

  return (
    <div className="relative h-16 bg-gray-900 rounded-lg p-2">
      <div className="relative h-full">
        {/* Timeline bar */}
        <div className="absolute inset-0 bg-gray-800 rounded" />
        
        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />

        {/* Annotation markers */}
        <TooltipProvider>
          {annotations.map((annotation) => (
            <Tooltip key={annotation.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSeek(annotation.timestamp_ms)}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 hover:scale-125 transition-transform"
                  style={{ left: `${(annotation.timestamp_ms / duration) * 100}%` }}
                >
                  <Badge
                    variant="outline"
                    className="h-8 w-8 p-0 flex items-center justify-center border-2"
                    style={{ borderColor: annotation.color, backgroundColor: `${annotation.color}20` }}
                  >
                    {getIcon(annotation.type)}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-bold">{annotation.title || annotation.type}</div>
                  <div className="text-gray-400">
                    {Math.floor(annotation.timestamp_ms / 1000)}s
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
