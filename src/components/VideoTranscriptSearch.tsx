import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Play, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResult {
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
  matches: {
    text: string;
    timestamp: number;
    formattedTime: string;
  }[];
}

interface Props {
  results: SearchResult[];
  onTimestampClick: (videoId: string, timestamp: number) => void;
  searchQuery: string;
}

export default function VideoTranscriptSearch({ results, onTimestampClick, searchQuery }: Props) {
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600">{part}</mark> : part
    );
  };

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Card key={result.videoId} className="p-4">
          <div className="flex gap-4">
            <img 
              src={result.thumbnailUrl}
              alt={result.videoTitle}
              className="w-32 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">{result.videoTitle}</h3>
              <Badge className="mb-3">{result.matches.length} matches</Badge>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {result.matches.map((match, idx) => (
                    <div key={idx} className="text-sm border-l-2 pl-3 hover:bg-accent/50 cursor-pointer" 
                         onClick={() => onTimestampClick(result.videoId, match.timestamp)}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono text-xs">{match.formattedTime}</span>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground">
                        {highlightText(match.text, searchQuery)}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
