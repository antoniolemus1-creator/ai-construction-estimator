import { useRef, useEffect, useState } from 'react';
import { Annotation } from '@/types/recording';

interface AnnotationCanvasProps {
  videoRef: HTMLVideoElement | null;
  annotations: Annotation[];
  activeTool: string;
  activeColor: string;
  onAddAnnotation: (annotation: Omit<Annotation, 'id'>) => void;
}

export const AnnotationCanvas = ({
  videoRef,
  annotations,
  activeTool,
  activeColor,
  onAddAnnotation
}: AnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !videoRef) return;

    canvas.width = videoRef.videoWidth || 1920;
    canvas.height = videoRef.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach(ann => {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = 3;

      if (ann.type === 'circle') {
        ctx.beginPath();
        ctx.arc(ann.position.x, ann.position.y, ann.data.radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (ann.type === 'text') {
        ctx.font = '24px Arial';
        ctx.fillText(ann.data.text, ann.position.x, ann.position.y);
      } else if (ann.type === 'highlight') {
        ctx.globalAlpha = 0.3;
        ctx.fillRect(ann.position.x, ann.position.y, ann.data.width, ann.data.height);
        ctx.globalAlpha = 1;
      }
    });
  }, [annotations, videoRef]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'pointer') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDrawing(true);
    setStartPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'pointer') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !videoRef) return;

    const endPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    if (activeTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
      );
      onAddAnnotation({
        timestamp: videoRef.currentTime,
        type: 'circle',
        position: startPos,
        data: { radius },
        color: activeColor
      });
    } else if (activeTool === 'highlight') {
      onAddAnnotation({
        timestamp: videoRef.currentTime,
        type: 'highlight',
        position: startPos,
        data: {
          width: endPos.x - startPos.x,
          height: endPos.y - startPos.y
        },
        color: activeColor
      });
    }

    setIsDrawing(false);
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="absolute top-0 left-0 w-full h-full cursor-crosshair"
      style={{ pointerEvents: activeTool === 'pointer' ? 'none' : 'auto' }}
    />
  );
};
