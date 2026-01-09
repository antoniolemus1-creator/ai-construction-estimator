import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  plan_id: string;
  plan_name: string;
  extracted_text: string;
  page_number: number;
  created_at: string;
  matchCount: number;
}

export function TextSearchPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const { data: ocrData, error } = await supabase
        .from('ocr_extracted_text')
        .select(`
          id,
          plan_id,
          extracted_text,
          page_number,
          created_at,
          plans(name)

        `)
        .ilike('extracted_text', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedResults = ocrData?.map((item: any) => ({
        id: item.id,
        plan_id: item.plan_id,
        plan_name: item.plans?.name || 'Unknown Plan',

        extracted_text: item.extracted_text,
        page_number: item.page_number,
        created_at: item.created_at,
        matchCount: (item.extracted_text.toLowerCase().match(
          new RegExp(searchQuery.toLowerCase(), 'g')
        ) || []).length
      })) || [];

      setResults(formattedResults);

      // Save search history
      await supabase.from('text_search_history').insert({
        search_query: searchQuery,
        results_count: formattedResults.length
      });

      toast.success(`Found ${formattedResults.length} results`);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Failed to search text');
    } finally {
      setIsSearching(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 px-1">{part}</mark> : part
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search extracted text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
          />
          <Button onClick={performSearch} disabled={isSearching}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
          {results.map((result) => (
            <Card 
              key={result.id} 
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedResult === result.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedResult(result.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold">{result.plan_name}</h4>
                </div>
                <Badge variant="secondary">{result.matchCount} matches</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Page {result.page_number}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm line-clamp-3">
                {highlightText(result.extracted_text.substring(0, 300) + '...', searchQuery)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}