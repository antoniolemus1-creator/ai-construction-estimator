import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Pencil, Highlighter, Square, Circle, ArrowRight, Type, 
  MapPin, MessageSquare, Mic, Star, ListChecks, Undo, Trash2 
} from 'lucide-react';
import { useState } from 'react';

interface VideoAnnotationToolbarProps {
  onToolSelect: (tool: string) => void;
  onColorSelect: (color: string) => void;
  onAddMarker: () => void;
  onAddLabel: () => void;
  onStartVoiceNote: () => void;
  onAddHighlight: () => void;
  onAddWorkflowStep: () => void;
  onUndo: () => void;
  onClear: () => void;
  activeTool: string;
  activeColor: string;
}

export function VideoAnnotationToolbar({
  onToolSelect,
  onColorSelect,
  onAddMarker,
  onAddLabel,
  onStartVoiceNote,
  onAddHighlight,
  onAddWorkflowStep,
  onUndo,
  onClear,
  activeTool,
  activeColor
}: VideoAnnotationToolbarProps) {
  const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
  
  const drawingTools = [
    { id: 'pen', icon: Pencil, label: 'Pen' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlighter' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'text', icon: Type, label: 'Text' }
  ];

  return (
    <Card className="p-4 bg-gray-900 border-gray-800">
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-gray-400 mb-2 block">Drawing Tools</Label>
          <div className="flex flex-wrap gap-2">
            {drawingTools.map(tool => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onToolSelect(tool.id)}
                className={activeTool === tool.id ? 'bg-amber-500' : ''}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div>
          <Label className="text-sm text-gray-400 mb-2 block">Annotation Types</Label>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onAddMarker}>
              <MapPin className="w-4 h-4 mr-1" /> Marker
            </Button>
            <Button variant="outline" size="sm" onClick={onAddLabel}>
              <MessageSquare className="w-4 h-4 mr-1" /> Label
            </Button>
            <Button variant="outline" size="sm" onClick={onStartVoiceNote}>
              <Mic className="w-4 h-4 mr-1" /> Voice Note
            </Button>
            <Button variant="outline" size="sm" onClick={onAddHighlight}>
              <Star className="w-4 h-4 mr-1" /> Highlight
            </Button>
            <Button variant="outline" size="sm" onClick={onAddWorkflowStep}>
              <ListChecks className="w-4 h-4 mr-1" /> Step
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div>
          <Label className="text-sm text-gray-400 mb-2 block">Colors</Label>
          <div className="flex gap-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => onColorSelect(color)}
                className={`w-8 h-8 rounded-full border-2 ${activeColor === color ? 'border-white scale-110' : 'border-gray-700'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onUndo}>
            <Undo className="w-4 h-4 mr-1" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="w-4 h-4 mr-1" /> Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}
