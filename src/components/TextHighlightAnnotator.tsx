import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Highlighter, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Annotation {
  id: string;
  annotation_text: string;
  highlighted_text: string;
  color: string;
  category: string;
  created_at: string;
}

interface TextHighlightAnnotatorProps {
  ocrTextId: string;
  planId: string;
  extractedText: string;
}

export function TextHighlightAnnotator({ 
  ocrTextId, 
  planId, 
  extractedText 
}: TextHighlightAnnotatorProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [annotationText, setAnnotationText] = useState('');
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [category, setCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    { name: 'yellow', class: 'bg-yellow-200' },
    { name: 'green', class: 'bg-green-200' },
    { name: 'blue', class: 'bg-blue-200' },
    { name: 'pink', class: 'bg-pink-200' },
    { name: 'orange', class: 'bg-orange-200' }
  ];

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text) {
      setSelectedText(text);
    }
  };

  const saveAnnotation = async () => {
    if (!selectedText || !annotationText) {
      toast.error('Please select text and add annotation');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('text_annotations')
        .insert({
          ocr_text_id: ocrTextId,
          plan_id: planId,
          annotation_text: annotationText,
          highlighted_text: selectedText,
          color: highlightColor,
          category: category || 'general'
        })
        .select()
        .single();

      if (error) throw error;

      setAnnotations([...annotations, data]);
      setAnnotationText('');
      setSelectedText('');
      setCategory('');
      toast.success('Annotation saved');
    } catch (error: any) {
      console.error('Save annotation error:', error);
      toast.error('Failed to save annotation');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAnnotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('text_annotations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAnnotations(annotations.filter(a => a.id !== id));
      toast.success('Annotation deleted');
    } catch (error: any) {
      toast.error('Failed to delete annotation');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Highlighter className="h-5 w-5 text-yellow-600" />
          Highlight & Annotate
        </h3>

        <div 
          className="p-3 bg-gray-50 rounded-lg mb-4 max-h-96 overflow-y-auto select-text"
          onMouseUp={handleTextSelection}
        >
          <p className="text-sm whitespace-pre-wrap">{extractedText}</p>
        </div>

        {selectedText && (
          <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium">Selected: "{selectedText}"</p>
            
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color.name}
                  className={`w-8 h-8 rounded ${color.class} border-2 ${
                    highlightColor === color.name ? 'border-black' : 'border-gray-300'
                  }`}
                  onClick={() => setHighlightColor(color.name)}
                />
              ))}
            </div>

            <Input
              placeholder="Category (optional)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <Textarea
              placeholder="Add your annotation..."
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              rows={3}
            />

            <Button onClick={saveAnnotation} disabled={isSaving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Annotation
            </Button>
          </div>
        )}
      </Card>

      {annotations.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">Annotations ({annotations.length})</h4>
          <div className="space-y-2">
            {annotations.map(annotation => (
              <div key={annotation.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary">{annotation.category}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAnnotation(annotation.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                <p className="text-sm font-medium mb-1">"{annotation.highlighted_text}"</p>
                <p className="text-sm text-gray-600">{annotation.annotation_text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}