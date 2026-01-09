import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  type: string;
  importance: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (node: Node) => void;
  selectedNode?: string | null;
}

export function KnowledgeGraphVisualization({ nodes, edges, onNodeClick, selectedNode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const typeColors: Record<string, string> = {
    material: '#3b82f6',
    technique: '#10b981',
    formula: '#f59e0b',
    best_practice: '#8b5cf6',
    tool: '#ef4444',
    measurement: '#06b6d4'
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;

    // Initialize positions
    nodes.forEach((node, i) => {
      if (!node.x) {
        node.x = width / 2 + Math.random() * 200 - 100;
        node.y = height / 2 + Math.random() * 200 - 100;
        node.vx = 0;
        node.vy = 0;
      }
    });

    const simulate = () => {
      // Force simulation
      nodes.forEach(node => {
        let fx = 0, fy = 0;

        // Center force
        fx += (width / 2 - node.x!) * 0.01;
        fy += (height / 2 - node.y!) * 0.01;

        // Repulsion
        nodes.forEach(other => {
          if (node.id !== other.id) {
            const dx = node.x! - other.x!;
            const dy = node.y! - other.y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 5000 / (dist * dist);
            fx += dx / dist * force;
            fy += dy / dist * force;
          }
        });

        // Edge attraction
        edges.forEach(edge => {
          if (edge.source === node.id || edge.target === node.id) {
            const other = nodes.find(n => n.id === (edge.source === node.id ? edge.target : edge.source));
            if (other) {
              const dx = other.x! - node.x!;
              const dy = other.y! - node.y!;
              fx += dx * 0.05 * edge.strength;
              fy += dy * 0.05 * edge.strength;
            }
          }
        });

        node.vx = (node.vx! + fx) * 0.85;
        node.vy = (node.vy! + fy) * 0.85;
        node.x! += node.vx!;
        node.y! += node.vy!;
      });

      // Draw
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);

      // Draw edges
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
          ctx.strokeStyle = `rgba(100, 100, 100, ${edge.strength * 0.5})`;
          ctx.lineWidth = edge.strength * 2;
          ctx.beginPath();
          ctx.moveTo(source.x!, source.y!);
          ctx.lineTo(target.x!, target.y!);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const radius = 5 + node.importance * 2;
        const isSelected = node.id === selectedNode;
        
        ctx.fillStyle = typeColors[node.type] || '#666';
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x!, node.y! + radius + 15);
      });

      ctx.restore();
      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodes, edges, scale, offset, selectedNode]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.max(0.5, Math.min(3, s - e.deltaY * 0.001)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-[600px] bg-slate-900 rounded-lg cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute top-4 right-4 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setScale(s => Math.min(3, s + 0.2))}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
