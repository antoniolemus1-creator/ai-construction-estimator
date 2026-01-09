import { useRef, useState, useEffect } from 'react';
import { DrawingPath, DrawingShape } from '@/types/videoAnnotations';

interface VideoDrawingCanvasProps {
  currentTime: number;
  onDrawingComplete?: (drawing: DrawingPath | DrawingShape) => void;
  tool?: 'pen' | 'highlighter' | 'rectangle' | 'circle' | 'arrow' | 'text';
  color?: string;
  width?: number;
}

export function VideoDrawingCanvas({
  currentTime,
  onDrawingComplete,
  tool = 'pen',
  color = '#f59e0b',
  width = 3
}: VideoDrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    
    if (tool === 'pen' || tool === 'highlighter') {
      setCurrentPath([{ x, y }]);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'highlighter') {
      setCurrentPath(prev => [...prev, { x, y }]);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === 'highlighter' ? width * 3 : width;
      ctx.globalAlpha = tool === 'highlighter' ? 0.3 : 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(currentPath[currentPath.length - 1]?.x || x, currentPath[currentPath.length - 1]?.y || y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (tool === 'pen' || tool === 'highlighter') {
      onDrawingComplete?.({
        points: currentPath,
        color,
        width,
        tool
      });
    }
    
    setCurrentPath([]);
    setStartPoint(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
}
