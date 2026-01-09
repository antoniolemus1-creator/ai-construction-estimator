import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MousePointer, Minus, Square, Type, Ruler, MessageSquare, ArrowRight, Undo, Trash2, Save } from 'lucide-react';
import { useState } from 'react';

interface PlanAnnotationToolsProps {
  activeTool: string;
  onToolSelect: (tool: string) => void;
  onColorSelect: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onScaleChange: (scale: number) => void;
  onUndo: () => void;
  onClear: () => void;
  onSave: () => void;
  activeColor: string;
  strokeWidth: number;
  scale: number;
}

export const PlanAnnotationTools = ({
  activeTool,
  onToolSelect,
  onColorSelect,
  onStrokeWidthChange,
  onScaleChange,
  onUndo,
  onClear,
  onSave,
  activeColor,
  strokeWidth,
  scale
}: PlanAnnotationToolsProps) => {
  const tools = [
    { id: 'pointer', icon: MousePointer, label: 'Select' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'measurement', icon: Ruler, label: 'Measure' },
    { id: 'callout', icon: MessageSquare, label: 'Callout' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' }
  ];

  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#000000'];

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        {tools.map(tool => (
          <Button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            variant={activeTool === tool.id ? 'default' : 'outline'}
            size="sm"
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={`w-8 h-8 rounded border-2 ${activeColor === color ? 'border-primary' : 'border-gray-300'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Stroke Width</Label>
          <Input
            type="number"
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(Number(e.target.value))}
            min={1}
            max={10}
          />
        </div>
        <div>
          <Label>Scale (ft/px)</Label>
          <Input
            type="number"
            value={scale}
            onChange={(e) => onScaleChange(Number(e.target.value))}
            step={0.01}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onUndo} variant="outline" size="sm">
          <Undo className="w-4 h-4 mr-1" /> Undo
        </Button>
        <Button onClick={onClear} variant="outline" size="sm">
          <Trash2 className="w-4 h-4 mr-1" /> Clear
        </Button>
        <Button onClick={onSave} variant="default" size="sm">
          <Save className="w-4 h-4 mr-1" /> Save
        </Button>
      </div>
    </Card>
  );
};
