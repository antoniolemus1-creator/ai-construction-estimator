import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Loader2, Filter, Download } from 'lucide-react';

interface SmartTextCategorizationPanelProps {
  planId: string;
}

const categoryColors: Record<string, string> = {
  dimension: 'bg-blue-100 text-blue-800',
  material_spec: 'bg-green-100 text-green-800',
  note: 'bg-yellow-100 text-yellow-800',
  room_label: 'bg-purple-100 text-purple-800',
  equipment: 'bg-orange-100 text-orange-800',
  code_reference: 'bg-red-100 text-red-800',
  quantity: 'bg-cyan-100 text-cyan-800',
  other: 'bg-gray-100 text-gray-800'
};

export function SmartTextCategorizationPanel({ planId }: SmartTextCategorizationPanelProps) {
  const [categorizedText, setCategorizedText] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadCategorizedText();
  }, [planId]);

  const loadCategorizedText = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorized_text_extractions')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategorizedText(data || []);
    } catch (error) {
      console.error('Error loading categorized text:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredText = selectedCategory === 'all' 
    ? categorizedText 
    : categorizedText.filter(item => item.category === selectedCategory);

  const categoryCounts = categorizedText.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Smart Text Categorization</h3>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All ({categorizedText.length})
        </Button>
        {Object.entries(categoryCounts).map(([category, count]) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category.replace('_', ' ')} ({count})
          </Button>
        ))}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredText.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <Badge className={categoryColors[item.category]}>
                  {item.category.replace('_', ' ')}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Page {item.page_number}
                </span>
              </div>
              <p className="text-sm mb-3">{item.text_content}</p>
              {item.structured_data && (
                <div className="bg-muted p-3 rounded text-xs">
                  <pre>{JSON.stringify(item.structured_data, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}