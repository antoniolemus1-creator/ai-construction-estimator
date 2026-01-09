import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlanAnnotationCanvas } from './PlanAnnotationCanvas';
import { PlanAnnotationTools } from './PlanAnnotationTools';
import { PlanAnnotation } from '@/types/annotations';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface PlanViewerProps {
  planRevisionId: string;
  imageUrl: string;
}

export const PlanViewer = ({ planRevisionId, imageUrl }: PlanViewerProps) => {
  const [annotations, setAnnotations] = useState<PlanAnnotation[]>([]);
  const [activeTool, setActiveTool] = useState('pointer');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [scale, setScale] = useState(0.1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    loadAnnotations();
  }, [planRevisionId]);

  const loadAnnotations = async () => {
    try {
      const { data, error } = await supabase
        .from('plan_annotations')
        .select('*')
        .eq('plan_revision_id', planRevisionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAnnotations(data || []);
    } catch (error: any) {
      toast.error('Failed to load annotations: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnotation = (annotation: Partial<PlanAnnotation>) => {
    const newAnnotation = {
      ...annotation,
      id: crypto.randomUUID(),
      plan_revision_id: planRevisionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as PlanAnnotation;
    setAnnotations([...annotations, newAnnotation]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const annotationsToSave = annotations.map(ann => ({
        plan_revision_id: planRevisionId,
        user_id: user.id,
        annotation_type: ann.annotation_type,
        position: ann.position,
        style: ann.style,
        content: ann.content,
        measurement_data: ann.measurement_data,
        page_number: ann.page_number
      }));

      await supabase.from('plan_annotations').delete().eq('plan_revision_id', planRevisionId);
      const { error } = await supabase.from('plan_annotations').insert(annotationsToSave);

      if (error) throw error;
      toast.success('Annotations saved successfully');
      loadAnnotations();
    } catch (error: any) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  const handleClear = () => {
    if (confirm('Clear all annotations?')) {
      setAnnotations([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PlanAnnotationTools
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        onColorSelect={setActiveColor}
        onStrokeWidthChange={setStrokeWidth}
        onScaleChange={setScale}
        onUndo={handleUndo}
        onClear={handleClear}
        onSave={handleSave}
        activeColor={activeColor}
        strokeWidth={strokeWidth}
        scale={scale}
      />

      <Card className="p-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.1, 3))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm py-2">{Math.round(zoom * 100)}%</span>
          </div>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>

        <div className="overflow-auto max-h-[600px]" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <PlanAnnotationCanvas
            imageUrl={imageUrl}
            annotations={annotations}
            activeTool={activeTool}
            activeColor={activeColor}
            strokeWidth={strokeWidth}
            scale={scale}
            onAddAnnotation={handleAddAnnotation}
            width={1200}
            height={900}
          />
        </div>
      </Card>

      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving annotations...</span>
          </Card>
        </div>
      )}
    </div>
  );
};
