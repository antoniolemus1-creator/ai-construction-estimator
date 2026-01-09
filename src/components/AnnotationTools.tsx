import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MousePointer, Circle, Type, Highlighter, Undo, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface AnnotationToolsProps {
  onToolSelect: (tool: string) => void;
  onColorSelect: (color: string) => void;
  onUndo: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export const AnnotationTools = ({
  onToolSelect,
  onColorSelect,
  onUndo,
  onClear,
  disabled = false
}: AnnotationToolsProps) => {
  const [activeTool, setActiveTool] = useState('pointer');
  const [activeColor, setActiveColor] = useState('#00d4ff');

  const tools = [
    { id: 'pointer', icon: MousePointer, label: 'Select' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'highlight', icon: Highlighter, label: 'Highlight' }
  ];

  const colors = [
    '#00d4ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#ffffff'
  ];

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId);
    onToolSelect(toolId);
  };

  const handleColorSelect = (color: string) => {
    setActiveColor(color);
    onColorSelect(color);
  };

  return (
    <Card className="p-4 bg-[#1a1f2e] border-cyan-500/20">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {tools.map(tool => (
            <Button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              disabled={disabled}
              variant={activeTool === tool.id ? 'default' : 'outline'}
              className={activeTool === tool.id ? 'bg-cyan-600' : ''}
              size="sm"
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex gap-2">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              disabled={disabled}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                activeColor === color ? 'border-white scale-110' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <div className="flex gap-2">
          <Button onClick={onUndo} disabled={disabled} variant="outline" size="sm">
            <Undo className="w-4 h-4" />
          </Button>
          <Button onClick={onClear} disabled={disabled} variant="outline" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
