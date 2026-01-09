import { useRef, useEffect, useState } from 'react';
import { PlanAnnotation } from '@/types/annotations';

interface PlanAnnotationCanvasProps {
  imageUrl: string;
  annotations: PlanAnnotation[];
  activeTool: string;
  activeColor: string;
  strokeWidth: number;
  scale: number;
  onAddAnnotation: (annotation: Partial<PlanAnnotation>) => void;
  width: number;
  height: number;
}

export const PlanAnnotationCanvas = ({
  imageUrl,
  annotations,
  activeTool,
  activeColor,
  strokeWidth,
  scale,
  onAddAnnotation,
  width,
  height
}: PlanAnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => setImage(img);
  }, [imageUrl]);

  useEffect(() => {
    redrawCanvas();
  }, [annotations, image, currentPos, isDrawing, startPos, activeTool]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (image) {
      ctx.drawImage(image, 0, 0, width, height);
    }

    annotations.forEach(ann => {
      drawAnnotation(ctx, ann);
    });

    if (isDrawing && activeTool !== 'pointer') {
      drawPreview(ctx);
    }
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: PlanAnnotation) => {
    ctx.strokeStyle = ann.style.color || '#000';
    ctx.fillStyle = ann.style.color || '#000';
    ctx.lineWidth = ann.style.strokeWidth || 2;

    switch (ann.annotation_type) {
      case 'line':
        ctx.beginPath();
        ctx.moveTo(ann.position.x, ann.position.y);
        ctx.lineTo(ann.position.x2!, ann.position.y2!);
        ctx.stroke();
        break;
      case 'rectangle':
        ctx.strokeRect(ann.position.x, ann.position.y, ann.position.width!, ann.position.height!);
        break;
      case 'text':
        ctx.font = `${ann.style.fontSize || 16}px Arial`;
        ctx.fillText(ann.content || '', ann.position.x, ann.position.y);
        break;
      case 'measurement':
        drawMeasurement(ctx, ann);
        break;
    }
  };

  const drawMeasurement = (ctx: CanvasRenderingContext2D, ann: PlanAnnotation) => {
    ctx.beginPath();
    ctx.moveTo(ann.position.x, ann.position.y);
    ctx.lineTo(ann.position.x2!, ann.position.y2!);
    ctx.stroke();
    
    if (ann.measurement_data) {
      const midX = (ann.position.x + ann.position.x2!) / 2;
      const midY = (ann.position.y + ann.position.y2!) / 2;
      ctx.font = '14px Arial';
      ctx.fillStyle = '#fff';
      ctx.fillRect(midX - 30, midY - 12, 60, 24);
      ctx.fillStyle = ann.style.color || '#000';
      ctx.fillText(`${ann.measurement_data.length.toFixed(2)} ${ann.measurement_data.unit}`, midX - 25, midY + 5);
    }
  };

  const drawPreview = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = strokeWidth;
    ctx.setLineDash([5, 5]);

    if (activeTool === 'line' || activeTool === 'measurement' || activeTool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    } else if (activeTool === 'rectangle') {
      ctx.strokeRect(startPos.x, startPos.y, currentPos.x - startPos.x, currentPos.y - startPos.y);
    }
    ctx.setLineDash([]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pointer') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCurrentPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool === 'pointer') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const annotation: Partial<PlanAnnotation> = {
      annotation_type: activeTool as any,
      position: { x: startPos.x, y: startPos.y },
      style: { color: activeColor, strokeWidth },
      page_number: 1
    };

    if (activeTool === 'line' || activeTool === 'arrow') {
      annotation.position = { ...annotation.position, x2: endX, y2: endY };
    } else if (activeTool === 'rectangle') {
      annotation.position = { ...annotation.position, width: endX - startPos.x, height: endY - startPos.y };
    } else if (activeTool === 'measurement') {
      const pixelLength = Math.sqrt(Math.pow(endX - startPos.x, 2) + Math.pow(endY - startPos.y, 2));
      const length = pixelLength * scale;
      annotation.position = { ...annotation.position, x2: endX, y2: endY };
      annotation.measurement_data = { length, unit: 'ft', scale, pixelLength };
      annotation.content = `${length.toFixed(2)} ft`;
    } else if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        annotation.content = text;
        annotation.style = { ...annotation.style, fontSize: 16 };
      }
    }

    onAddAnnotation(annotation);
    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="border border-gray-300 cursor-crosshair"
    />
  );
};
