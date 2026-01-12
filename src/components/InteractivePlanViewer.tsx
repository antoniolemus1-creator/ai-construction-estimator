import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ZoomIn, ZoomOut, RotateCw, Move, Ruler, Square, Circle, Type,
  ArrowRight, Pencil, Eraser, Printer, Download, Eye, EyeOff,
  ChevronLeft, ChevronRight, Maximize2, MousePointer, Cloud
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TakeoffItem {
  id: string;
  item_type: string;
  wall_type: string | null;
  quantity: number;
  unit: string;
  room_name: string | null;
  page_number: number;
  color?: string;
  visible?: boolean;
  coordinates?: { x: number; y: number; width?: number; height?: number; points?: {x: number, y: number}[] }[];
}

interface Markup {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'cloud' | 'freehand';
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
  text?: string;
}

interface InteractivePlanViewerProps {
  planId: string;
  pdfUrl: string;
  onMeasurement?: (length: number, unit: string) => void;
}

// Color palette for different item types
const ITEM_COLORS: Record<string, string> = {
  'wall': '#3B82F6',
  'wall_type_1a': '#EF4444',
  'wall_type_1b': '#F97316',
  'wall_type_2a': '#EAB308',
  'wall_type_2b': '#84CC16',
  'wall_type_3a': '#22C55E',
  'wall_type_3b': '#14B8A6',
  'wall_type_4a': '#06B6D4',
  'wall_type_4b': '#0EA5E9',
  'wall_type_4c': '#3B82F6',
  'wall_type_9c': '#8B5CF6',
  'wall_type_10': '#A855F7',
  'door': '#F59E0B',
  'double_door': '#D97706',
  'window': '#06B6D4',
  'ceiling': '#8B5CF6',
  'toilet': '#EC4899',
  'sink': '#14B8A6',
  'shower': '#6366F1',
  'bathtub': '#8B5CF6',
  'elevator': '#6B7280',
};

const getItemColor = (itemType: string, wallType: string | null): string => {
  if (wallType) {
    const key = `wall_type_${wallType.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    return ITEM_COLORS[key] || ITEM_COLORS['wall'];
  }
  return ITEM_COLORS[itemType] || '#6B7280';
};

type Tool = 'select' | 'pan' | 'measure' | 'line' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'cloud' | 'freehand' | 'eraser';

// Helper function to draw cloud rectangle (defined outside component for stability)
const drawCloudRect = (ctx: CanvasRenderingContext2D, p1: {x: number, y: number}, p2: {x: number, y: number}, color: string) => {
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const w = Math.abs(p2.x - p1.x);
  const h = Math.abs(p2.y - p1.y);

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const arcRadius = 10;
  const arcsH = Math.ceil(w / (arcRadius * 2));
  const arcsV = Math.ceil(h / (arcRadius * 2));

  ctx.beginPath();

  // Top edge
  for (let i = 0; i < arcsH; i++) {
    const cx = x + arcRadius + i * arcRadius * 2;
    ctx.arc(cx, y, arcRadius, Math.PI, 0, false);
  }

  // Right edge
  for (let i = 0; i < arcsV; i++) {
    const cy = y + arcRadius + i * arcRadius * 2;
    ctx.arc(x + w, cy, arcRadius, -Math.PI / 2, Math.PI / 2, false);
  }

  // Bottom edge
  for (let i = arcsH - 1; i >= 0; i--) {
    const cx = x + arcRadius + i * arcRadius * 2;
    ctx.arc(cx, y + h, arcRadius, 0, Math.PI, false);
  }

  // Left edge
  for (let i = arcsV - 1; i >= 0; i--) {
    const cy = y + arcRadius + i * arcRadius * 2;
    ctx.arc(x, cy, arcRadius, Math.PI / 2, -Math.PI / 2, false);
  }

  ctx.closePath();
  ctx.stroke();
};

// Helper function to render a single markup (defined outside component for stability)
const renderMarkup = (ctx: CanvasRenderingContext2D, markup: Markup) => {
  ctx.strokeStyle = markup.color;
  ctx.fillStyle = `${markup.color}33`;
  ctx.lineWidth = markup.strokeWidth;

  switch (markup.type) {
    case 'line':
      if (markup.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(markup.points[0].x, markup.points[0].y);
        ctx.lineTo(markup.points[1].x, markup.points[1].y);
        ctx.stroke();
      }
      break;

    case 'arrow':
      if (markup.points.length >= 2) {
        const start = markup.points[0];
        const end = markup.points[1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 15;

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
      break;

    case 'rectangle':
      if (markup.points.length >= 2) {
        const x = Math.min(markup.points[0].x, markup.points[1].x);
        const y = Math.min(markup.points[0].y, markup.points[1].y);
        const w = Math.abs(markup.points[1].x - markup.points[0].x);
        const h = Math.abs(markup.points[1].y - markup.points[0].y);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      }
      break;

    case 'circle':
      if (markup.points.length >= 2) {
        const dx = markup.points[1].x - markup.points[0].x;
        const dy = markup.points[1].y - markup.points[0].y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        ctx.beginPath();
        ctx.arc(markup.points[0].x, markup.points[0].y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;

    case 'cloud':
      if (markup.points.length >= 2) {
        drawCloudRect(ctx, markup.points[0], markup.points[1], markup.color);
      }
      break;

    case 'freehand':
      if (markup.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(markup.points[0].x, markup.points[0].y);
        for (let i = 1; i < markup.points.length; i++) {
          ctx.lineTo(markup.points[i].x, markup.points[i].y);
        }
        ctx.stroke();
      }
      break;

    case 'text':
      if (markup.text && markup.points.length >= 1) {
        ctx.font = '16px Arial';
        ctx.fillStyle = markup.color;
        ctx.fillText(markup.text, markup.points[0].x, markup.points[0].y);
      }
      break;
  }
};

export function InteractivePlanViewer({ planId, pdfUrl, onMeasurement }: InteractivePlanViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([]);
  const [markups, setMarkups] = useState<Markup[]>([]);
  const [currentMarkup, setCurrentMarkup] = useState<Markup | null>(null);
  const [showTakeoff, setShowTakeoff] = useState(true);
  const [showMarkups, setShowMarkups] = useState(true);
  const [selectedColor, setSelectedColor] = useState('#EF4444');
  const [strokeWidth, setStrokeWidth] = useState(2);

  // Scale calibration
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{x: number, y: number}[]>([]);
  const [pixelsPerFoot, setPixelsPerFoot] = useState(10); // Default assumption
  const [measurementStart, setMeasurementStart] = useState<{x: number, y: number} | null>(null);
  const [currentMeasurement, setCurrentMeasurement] = useState<string | null>(null);

  // Load PDF
  useEffect(() => {
    if (!pdfUrl) return;

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Load takeoff data
  useEffect(() => {
    const loadTakeoffData = async () => {
      const { data, error } = await supabase
        .from('takeoff_data')
        .select('*')
        .eq('plan_id', planId)
        .order('page_number, item_type');

      if (!error && data) {
        const itemsWithColors = data.map(item => {
          // Parse coordinates from dimensions JSON
          let coordinates: TakeoffItem['coordinates'] = undefined;
          if (item.dimensions) {
            try {
              const dims = typeof item.dimensions === 'string' ? JSON.parse(item.dimensions) : item.dimensions;
              console.log('Parsing dimensions for', item.item_type, ':', dims);
              if (dims.coordinates) {
                if (dims.coordinates.points && Array.isArray(dims.coordinates.points)) {
                  // Wall - has start/end points - wrap in object with points property
                  coordinates = [{
                    x: dims.coordinates.points[0]?.x || 0,
                    y: dims.coordinates.points[0]?.y || 0,
                    points: dims.coordinates.points.map((p: {x: number, y: number}) => ({ x: p.x, y: p.y }))
                  }];
                } else if (dims.coordinates.start_x !== undefined) {
                  // Wall with start/end coordinates (alternative format from AI)
                  coordinates = [{
                    x: dims.coordinates.start_x,
                    y: dims.coordinates.start_y,
                    points: [
                      { x: dims.coordinates.start_x, y: dims.coordinates.start_y },
                      { x: dims.coordinates.end_x, y: dims.coordinates.end_y }
                    ]
                  }];
                } else if (dims.coordinates.width && dims.coordinates.height) {
                  // Ceiling/Room - has bounding box
                  coordinates = [{ x: dims.coordinates.x, y: dims.coordinates.y, width: dims.coordinates.width, height: dims.coordinates.height }];
                } else if (dims.coordinates.x !== undefined) {
                  // Door/Window/Fixture - has point marker
                  coordinates = [{ x: dims.coordinates.x, y: dims.coordinates.y }];
                }
              }
            } catch (e) {
              console.warn('Could not parse dimensions:', e);
            }
          }

          return {
            ...item,
            page_number: item.page_number || 1,
            color: getItemColor(item.item_type, item.wall_type),
            visible: true,
            coordinates
          };
        });
        setTakeoffItems(itemsWithColors);
        console.log('Loaded takeoff items:', itemsWithColors.length, 'with coordinates:', itemsWithColors.filter(i => i.coordinates).length);
        console.log('Items by page:', itemsWithColors.reduce((acc, i) => { acc[i.page_number] = (acc[i.page_number] || 0) + 1; return acc; }, {} as Record<number, number>));
      }
    };

    if (planId) loadTakeoffData();
  }, [planId]);

  // Render takeoff overlays and markups (defined before useEffect that uses it)
  const renderOverlays = useCallback(() => {
    if (!overlayCanvasRef.current) return;

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Helper to convert normalized coordinates (0-1000) to canvas pixels
    // AI returns coordinates in 0-1000 range, we need to map to actual canvas size
    const toCanvasX = (normalizedX: number) => (normalizedX / 1000) * canvas.width;
    const toCanvasY = (normalizedY: number) => (normalizedY / 1000) * canvas.height;

    // Render takeoff highlights - filter by current page
    if (showTakeoff) {
      const pageItems = takeoffItems.filter(item => item.page_number === currentPage);
      console.log(`Rendering ${pageItems.length} items for page ${currentPage}`);

      for (const item of pageItems) {
        if (!item.visible || !item.coordinates) continue;

        ctx.strokeStyle = item.color || '#3B82F6';
        ctx.fillStyle = item.color ? `${item.color}33` : '#3B82F633'; // 20% opacity
        ctx.lineWidth = 4;

        for (const coord of item.coordinates) {
          if (coord.points && coord.points.length > 1) {
            // Draw polyline (for walls) - thicker line with color fill effect
            ctx.beginPath();
            ctx.moveTo(toCanvasX(coord.points[0].x), toCanvasY(coord.points[0].y));
            for (let i = 1; i < coord.points.length; i++) {
              ctx.lineTo(toCanvasX(coord.points[i].x), toCanvasY(coord.points[i].y));
            }
            ctx.stroke();

            // Draw thick highlight behind the wall
            ctx.save();
            ctx.lineWidth = 12;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(toCanvasX(coord.points[0].x), toCanvasY(coord.points[0].y));
            for (let i = 1; i < coord.points.length; i++) {
              ctx.lineTo(toCanvasX(coord.points[i].x), toCanvasY(coord.points[i].y));
            }
            ctx.stroke();
            ctx.restore();

            // Add label at midpoint
            if (coord.points.length >= 2) {
              const midX = toCanvasX((coord.points[0].x + coord.points[coord.points.length - 1].x) / 2);
              const midY = toCanvasY((coord.points[0].y + coord.points[coord.points.length - 1].y) / 2);
              ctx.font = 'bold 12px Arial';
              ctx.fillStyle = item.color || '#3B82F6';
              ctx.fillText(item.wall_type || item.item_type, midX + 5, midY - 5);
            }
          } else if (coord.width && coord.height) {
            // Draw rectangle (for rooms, ceilings)
            const x = toCanvasX(coord.x);
            const y = toCanvasY(coord.y);
            const w = toCanvasX(coord.width);
            const h = toCanvasY(coord.height);
            ctx.fillRect(x, y, w, h);
            ctx.strokeRect(x, y, w, h);

            // Add label
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = item.color || '#3B82F6';
            ctx.fillText(item.room_name || item.item_type, x + 5, y + 15);
          } else {
            // Draw marker (for doors, windows, fixtures)
            const x = toCanvasX(coord.x);
            const y = toCanvasY(coord.y);
            ctx.beginPath();
            ctx.arc(x, y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Add label
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#000';
            ctx.fillText(item.item_type, x + 18, y + 4);
          }
        }
      }
    }

    // Render markups
    if (showMarkups) {
      for (const markup of markups) {
        renderMarkup(ctx, markup);
      }

      // Render current in-progress markup
      if (currentMarkup) {
        renderMarkup(ctx, currentMarkup);
      }
    }

    // Render measurement line
    if (measurementStart && activeTool === 'measure') {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(measurementStart.x, measurementStart.y);
      // Will be drawn to mouse position in mousemove
      ctx.setLineDash([]);
    }
  }, [takeoffItems, markups, currentMarkup, showTakeoff, showMarkups, scale, measurementStart, activeTool, currentPage]);

  // Render PDF page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      const viewport = page.getViewport({ scale, rotation });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Also resize overlay canvas
      if (overlayCanvasRef.current) {
        overlayCanvasRef.current.width = viewport.width;
        overlayCanvasRef.current.height = viewport.height;
      }

      await page.render({
        canvasContext: ctx,
        viewport
      }).promise;

      // Render overlays after PDF
      renderOverlays();
    };

    renderPage();
  }, [pdfDoc, currentPage, scale, rotation, renderOverlays]);

  // Re-render overlays when dependencies change
  useEffect(() => {
    renderOverlays();
  }, [renderOverlays]);

  // Mouse handlers
  const getCanvasCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (activeTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    if (activeTool === 'measure') {
      if (!measurementStart) {
        setMeasurementStart(coords);
      } else {
        // Calculate distance
        const dx = coords.x - measurementStart.x;
        const dy = coords.y - measurementStart.y;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        const feetDistance = pixelDistance / pixelsPerFoot / scale;
        setCurrentMeasurement(`${feetDistance.toFixed(2)} ft`);
        onMeasurement?.(feetDistance, 'ft');
        setMeasurementStart(null);
      }
      return;
    }

    if (['line', 'rectangle', 'circle', 'arrow', 'cloud'].includes(activeTool)) {
      setCurrentMarkup({
        id: `markup-${Date.now()}`,
        type: activeTool as Markup['type'],
        points: [coords],
        color: selectedColor,
        strokeWidth
      });
    } else if (activeTool === 'freehand') {
      setCurrentMarkup({
        id: `markup-${Date.now()}`,
        type: 'freehand',
        points: [coords],
        color: selectedColor,
        strokeWidth
      });
    } else if (activeTool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        setMarkups(prev => [...prev, {
          id: `markup-${Date.now()}`,
          type: 'text',
          points: [coords],
          color: selectedColor,
          strokeWidth,
          text
        }]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);

    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (currentMarkup) {
      if (currentMarkup.type === 'freehand') {
        setCurrentMarkup(prev => prev ? {
          ...prev,
          points: [...prev.points, coords]
        } : null);
      } else {
        setCurrentMarkup(prev => prev ? {
          ...prev,
          points: [prev.points[0], coords]
        } : null);
      }
      renderOverlays();
    }

    // Update measurement preview
    if (measurementStart && activeTool === 'measure') {
      const dx = coords.x - measurementStart.x;
      const dy = coords.y - measurementStart.y;
      const pixelDistance = Math.sqrt(dx * dx + dy * dy);
      const feetDistance = pixelDistance / pixelsPerFoot / scale;
      setCurrentMeasurement(`${feetDistance.toFixed(2)} ft`);

      // Draw measurement line
      const ctx = overlayCanvasRef.current?.getContext('2d');
      if (ctx) {
        renderOverlays();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(measurementStart.x, measurementStart.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw measurement text
        ctx.font = '14px Arial';
        ctx.fillStyle = '#EF4444';
        ctx.fillText(currentMeasurement || '', (measurementStart.x + coords.x) / 2, (measurementStart.y + coords.y) / 2 - 10);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (currentMarkup && currentMarkup.points.length >= 2) {
      setMarkups(prev => [...prev, currentMarkup]);
    }
    setCurrentMarkup(null);
  };

  // Calibration
  const handleCalibrate = () => {
    const knownLength = prompt('Enter the known length of a line you will draw (in feet):');
    if (knownLength) {
      setCalibrationMode(true);
      setCalibrationPoints([]);
      alert('Click two points on a known distance (like a dimension line)');
    }
  };

  // Toggle item visibility
  const toggleItemVisibility = (itemType: string, wallType: string | null) => {
    setTakeoffItems(prev => prev.map(item => {
      if (item.item_type === itemType && item.wall_type === wallType) {
        return { ...item, visible: !item.visible };
      }
      return item;
    }));
  };

  // Print function
  const handlePrint = () => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    // Create combined canvas
    const printCanvas = document.createElement('canvas');
    printCanvas.width = canvas.width;
    printCanvas.height = canvas.height;
    const ctx = printCanvas.getContext('2d')!;

    // Draw PDF
    ctx.drawImage(canvas, 0, 0);
    // Draw overlays
    ctx.drawImage(overlay, 0, 0);

    // Create print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Plan</title></head>
          <body style="margin:0;">
            <img src="${printCanvas.toDataURL()}" style="max-width:100%;"/>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Filter items for current page
  const currentPageItems = takeoffItems.filter(item => item.page_number === currentPage);

  // Group takeoff items for legend (current page only)
  const groupedItems = currentPageItems.reduce((acc, item) => {
    const key = item.wall_type ? `${item.item_type}-${item.wall_type}` : item.item_type;
    if (!acc[key]) {
      acc[key] = {
        itemType: item.item_type,
        wallType: item.wall_type,
        color: item.color || '#6B7280',
        items: [],
        totalQuantity: 0,
        unit: item.unit,
        visible: item.visible,
        hasCoordinates: false
      };
    }
    acc[key].items.push(item);
    acc[key].totalQuantity += item.quantity || 0;
    if (item.coordinates && item.coordinates.length > 0) {
      acc[key].hasCoordinates = true;
    }
    return acc;
  }, {} as Record<string, { itemType: string; wallType: string | null; color: string; items: TakeoffItem[]; totalQuantity: number; unit: string; visible?: boolean; hasCoordinates: boolean }>);

  // Check if any items have coordinates (current page)
  const itemsWithCoordinates = currentPageItems.filter(i => i.coordinates && i.coordinates.length > 0).length;
  const totalItems = currentPageItems.length;
  const totalAllPages = takeoffItems.length;

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Takeoff Legend */}
      <div className="w-72 border-r bg-background flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Takeoff Legend</h3>
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant={showTakeoff ? 'default' : 'outline'}
              onClick={() => setShowTakeoff(!showTakeoff)}
            >
              {showTakeoff ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-muted-foreground">
              {showTakeoff ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>

        {/* Page Totals Summary */}
        <div className="p-3 border-b bg-muted/30">
          <h4 className="font-medium text-xs mb-2 text-muted-foreground uppercase">Page Quantities</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(groupedItems)
              .filter(([, g]) => g.itemType === 'wall' || g.itemType === 'wall_type_total')
              .slice(0, 6)
              .map(([key, group]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded" style={{ backgroundColor: group.color }} />
                  <span className="truncate">{group.wallType || 'Wall'}</span>
                  <span className="font-medium ml-auto">{group.totalQuantity.toFixed(0)}</span>
                </div>
              ))}
          </div>
          {totalItems > 0 && itemsWithCoordinates === 0 && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
              <strong>No markup data.</strong> Re-extract the plan from AI Plan Analysis to see markup on the drawing.
            </div>
          )}
          {itemsWithCoordinates > 0 && (
            <div className="mt-2 text-xs text-green-600">
              {itemsWithCoordinates} of {totalItems} items can be shown on drawing
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {Object.entries(groupedItems).map(([key, group]) => (
              <div
                key={key}
                className={`flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm ${!group.hasCoordinates ? 'opacity-60' : ''}`}
                onClick={() => toggleItemVisibility(group.itemType, group.wallType)}
                title={group.hasCoordinates ? 'Click to toggle visibility' : 'No coordinates - re-extract to show on drawing'}
              >
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: group.visible && group.hasCoordinates ? group.color : 'transparent', borderColor: group.color }}
                />
                <span className="flex-1 truncate">
                  {group.wallType ? `Wall Type ${group.wallType}` : group.itemType.replace('_', ' ')}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {group.totalQuantity.toFixed(0)} {group.unit}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Viewer */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-2 flex items-center gap-1 flex-wrap">
          <TooltipProvider>
            {/* Selection Tools */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'select' ? 'default' : 'ghost'} onClick={() => setActiveTool('select')}>
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Select</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'pan' ? 'default' : 'ghost'} onClick={() => setActiveTool('pan')}>
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pan</TooltipContent>
              </Tooltip>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.max(0.25, s - 0.25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => setScale(s => Math.min(4, s + 0.25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => setRotation(r => (r + 90) % 360)}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rotate</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to View</TooltipContent>
              </Tooltip>
            </div>

            {/* Measurement Tools */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'measure' ? 'default' : 'ghost'} onClick={() => setActiveTool('measure')}>
                    <Ruler className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Measure</TooltipContent>
              </Tooltip>

              <Button size="sm" variant="ghost" onClick={handleCalibrate}>
                <span className="text-xs">Calibrate</span>
              </Button>

              {currentMeasurement && (
                <Badge variant="secondary">{currentMeasurement}</Badge>
              )}
            </div>

            {/* Markup Tools */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'line' ? 'default' : 'ghost'} onClick={() => setActiveTool('line')}>
                    <span className="text-xs font-bold">/</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Line</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'arrow' ? 'default' : 'ghost'} onClick={() => setActiveTool('arrow')}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Arrow</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'rectangle' ? 'default' : 'ghost'} onClick={() => setActiveTool('rectangle')}>
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rectangle</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'circle' ? 'default' : 'ghost'} onClick={() => setActiveTool('circle')}>
                    <Circle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Circle</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'cloud' ? 'default' : 'ghost'} onClick={() => setActiveTool('cloud')}>
                    <Cloud className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cloud</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'freehand' ? 'default' : 'ghost'} onClick={() => setActiveTool('freehand')}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Freehand</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'text' ? 'default' : 'ghost'} onClick={() => setActiveTool('text')}>
                    <Type className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Text</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant={activeTool === 'eraser' ? 'default' : 'ghost'} onClick={() => setActiveTool('eraser')}>
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eraser</TooltipContent>
              </Tooltip>
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <div className="flex gap-1">
                {['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#000000'].map(color => (
                  <div
                    key={color}
                    className={`w-5 h-5 rounded cursor-pointer border-2 ${selectedColor === color ? 'border-gray-800' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            {/* Print/Export */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={handlePrint}>
                    <Printer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" onClick={() => setShowMarkups(!showMarkups)}>
                    {showMarkups ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showMarkups ? 'Hide' : 'Show'} Markups</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Page Navigation */}
        <div className="border-b p-2 flex items-center justify-center gap-2">
          <Button size="sm" variant="ghost" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button size="sm" variant="ghost" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-gray-100 relative"
          style={{ cursor: activeTool === 'pan' ? 'grab' : activeTool === 'measure' ? 'crosshair' : 'default' }}
        >
          <div
            className="relative inline-block"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          >
            <canvas ref={canvasRef} className="block" />
            <canvas
              ref={overlayCanvasRef}
              className="absolute top-0 left-0"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t p-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Scale: {Math.round(scale * 100)}% | Rotation: {rotation}°</span>
          <span>{takeoffItems.length} items extracted</span>
        </div>
      </div>
    </div>
  );
}
