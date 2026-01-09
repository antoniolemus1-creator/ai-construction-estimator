import { VideoAnnotation } from '@/types/videoAnnotations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface VideoAnnotationsListProps {
  annotations: VideoAnnotation[];
  onSeekTo: (timestamp: number) => void;
  onEdit: (annotation: VideoAnnotation) => void;
  onDelete: (annotationId: string) => void;
}

export function VideoAnnotationsList({
  annotations,
  onSeekTo,
  onEdit,
  onDelete
}: VideoAnnotationsListProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const sortedAnnotations = [...annotations].sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <h3 className="text-lg font-bold text-white mb-4">Annotations</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {sortedAnnotations.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No annotations yet. Add markers, labels, or drawings to get started.
            </p>
          ) : (
            sortedAnnotations.map((annotation) => (
              <Card key={annotation.id} className="p-3 bg-gray-800 border-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: annotation.color }}
                      >
                        {annotation.type}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatTime(annotation.timestamp_ms)}
                      </span>
                    </div>
                    {annotation.title && (
                      <h4 className="text-sm font-semibold text-white truncate">
                        {annotation.title}
                      </h4>
                    )}
                    {annotation.description && (
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {annotation.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSeekTo(annotation.timestamp_ms)}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(annotation)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => onDelete(annotation.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
