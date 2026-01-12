import { useEffect, useState, useRef, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff, Home, Layers,
  Download, Sun, Moon, Grid3X3, Box
} from 'lucide-react';

// Types
interface Coordinates {
  x?: number;
  y?: number;
  points?: { x: number; y: number }[];
}

interface Dimensions {
  coordinates?: Coordinates;
}

interface WallData {
  id: string;
  wall_type: string | null;
  quantity: number; // linear footage
  room_name: string | null;
  dimensions: Dimensions | null;
  color?: string;
}

interface DoorData {
  id: string;
  room_name: string | null;
  door_size: string | null;
  dimensions: Dimensions | null;
}

interface WindowData {
  id: string;
  room_name: string | null;
  window_size: string | null;
  dimensions: Dimensions | null;
}

interface FloorPlan3DViewerProps {
  planId: string;
  deckHeight?: number; // in feet
  wallThickness?: number; // in feet
}

// Color palette for wall types
const WALL_TYPE_COLORS: Record<string, string> = {
  'A': '#3B82F6',
  'B': '#EF4444',
  'C': '#22C55E',
  'D': '#F59E0B',
  'E': '#8B5CF6',
  '1': '#EC4899',
  '1A': '#EF4444',
  '1B': '#F97316',
  '2A': '#EAB308',
  '2B': '#84CC16',
  '3A': '#22C55E',
  '3B': '#14B8A6',
  '4A': '#06B6D4',
  '4B': '#0EA5E9',
  '9C': '#8B5CF6',
  '10': '#A855F7',
  'WP-1': '#3B82F6',
  'WP-2': '#EF4444',
  'INT-1': '#22C55E',
  'EXT-1': '#F59E0B',
  'default': '#6B7280'
};

const getWallColor = (wallType: string | null): string => {
  if (!wallType) return WALL_TYPE_COLORS.default;
  const upperType = wallType.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return WALL_TYPE_COLORS[upperType] || WALL_TYPE_COLORS.default;
};

// 3D Wall Component
function Wall3D({
  start,
  end,
  height,
  thickness,
  color,
  wallType,
  showLabels
}: {
  start: { x: number; z: number };
  end: { x: number; z: number };
  height: number;
  thickness: number;
  color: string;
  wallType: string | null;
  showLabels: boolean;
}) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  const centerX = (start.x + end.x) / 2;
  const centerZ = (start.z + end.z) / 2;

  return (
    <group position={[centerX, height / 2, centerZ]} rotation={[0, -angle, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Wall edges for better visibility */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(length, height, thickness)]} />
        <lineBasicMaterial color="#000000" linewidth={1} />
      </lineSegments>
      {/* Wall type label */}
      {showLabels && wallType && (
        <Html position={[0, height / 2 + 0.5, 0]} center>
          <div className="bg-black/70 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
            {wallType}
          </div>
        </Html>
      )}
    </group>
  );
}

// Door Opening Component
function DoorOpening3D({
  position,
  width = 3,
  height = 7,
  wallThickness
}: {
  position: { x: number; z: number };
  width?: number;
  height?: number;
  wallThickness: number;
}) {
  return (
    <group position={[position.x, height / 2, position.z]}>
      {/* Door frame */}
      <mesh>
        <boxGeometry args={[width + 0.2, height + 0.2, wallThickness + 0.1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {/* Door opening (cutout visual) */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[width, height, wallThickness + 0.2]} />
        <meshStandardMaterial color="#4A5568" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Window Opening Component
function WindowOpening3D({
  position,
  width = 3,
  height = 4,
  sillHeight = 3,
  wallThickness
}: {
  position: { x: number; z: number };
  width?: number;
  height?: number;
  sillHeight?: number;
  wallThickness: number;
}) {
  return (
    <group position={[position.x, sillHeight + height / 2, position.z]}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[width + 0.2, height + 0.2, wallThickness + 0.1]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
      </mesh>
      {/* Glass */}
      <mesh>
        <boxGeometry args={[width - 0.2, height - 0.2, 0.1]} />
        <meshStandardMaterial color="#ADD8E6" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Floor Component
function Floor3D({ size, gridSize = 1 }: { size: number; gridSize?: number }) {
  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#E5E7EB" roughness={0.9} />
      </mesh>
      {/* Grid */}
      <Grid
        args={[size, size]}
        cellSize={gridSize}
        cellThickness={0.5}
        cellColor="#9CA3AF"
        sectionSize={gridSize * 5}
        sectionThickness={1}
        sectionColor="#6B7280"
        fadeDistance={size * 2}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

// Scene Component
function Scene({
  walls,
  doors,
  windows,
  deckHeight,
  wallThickness,
  showGrid,
  showLabels,
  visibleWallTypes
}: {
  walls: WallData[];
  doors: DoorData[];
  windows: WindowData[];
  deckHeight: number;
  wallThickness: number;
  showGrid: boolean;
  showLabels: boolean;
  visibleWallTypes: Set<string>;
}) {
  // Calculate scene bounds
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    walls.forEach(wall => {
      if (wall.dimensions?.coordinates?.points) {
        wall.dimensions.coordinates.points.forEach((p: { x: number; y: number }) => {
          // Convert from 0-1000 to feet (assuming 100ft max dimension)
          const x = (p.x / 1000) * 100;
          const z = (p.y / 1000) * 100;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
        });
      }
    });

    if (minX === Infinity) {
      // Default bounds if no walls
      return { minX: 0, maxX: 50, minZ: 0, maxZ: 50, centerX: 25, centerZ: 25, size: 50 };
    }

    const padding = 10;
    const size = Math.max(maxX - minX, maxZ - minZ) + padding * 2;
    return {
      minX: minX - padding,
      maxX: maxX + padding,
      minZ: minZ - padding,
      maxZ: maxZ + padding,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      size
    };
  }, [walls]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[bounds.centerX + 20, 30, bounds.centerZ + 20]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[bounds.centerX - 20, 20, bounds.centerZ - 20]}
        intensity={0.3}
      />

      {/* Floor */}
      {showGrid && (
        <group position={[bounds.centerX, 0, bounds.centerZ]}>
          <Floor3D size={bounds.size} gridSize={5} />
        </group>
      )}

      {/* Walls */}
      {walls.map((wall, index) => {
        if (!wall.dimensions?.coordinates?.points) return null;

        const wallType = wall.wall_type || 'default';
        if (!visibleWallTypes.has(wallType)) return null;

        const points = wall.dimensions.coordinates.points;
        if (points.length < 2) return null;

        // Convert coordinates from 0-1000 to feet
        const start = {
          x: (points[0].x / 1000) * 100,
          z: (points[0].y / 1000) * 100
        };
        const end = {
          x: (points[1].x / 1000) * 100,
          z: (points[1].y / 1000) * 100
        };

        return (
          <Wall3D
            key={wall.id || index}
            start={start}
            end={end}
            height={deckHeight}
            thickness={wallThickness}
            color={getWallColor(wall.wall_type)}
            wallType={wall.wall_type}
            showLabels={showLabels}
          />
        );
      })}

      {/* Doors */}
      {doors.map((door, index) => {
        if (!door.dimensions?.coordinates) return null;
        const coords = door.dimensions.coordinates;

        // Parse door size (e.g., "3'-0\" x 7'-0\"")
        let width = 3, height = 7;
        if (door.door_size) {
          const match = door.door_size.match(/(\d+)/g);
          if (match && match.length >= 2) {
            width = parseInt(match[0]);
            height = parseInt(match[1]);
          }
        }

        return (
          <DoorOpening3D
            key={door.id || `door-${index}`}
            position={{
              x: (coords.x / 1000) * 100,
              z: (coords.y / 1000) * 100
            }}
            width={width}
            height={height}
            wallThickness={wallThickness}
          />
        );
      })}

      {/* Windows */}
      {windows.map((window, index) => {
        if (!window.dimensions?.coordinates) return null;
        const coords = window.dimensions.coordinates;

        return (
          <WindowOpening3D
            key={window.id || `window-${index}`}
            position={{
              x: (coords.x / 1000) * 100,
              z: (coords.y / 1000) * 100
            }}
            wallThickness={wallThickness}
          />
        );
      })}
    </>
  );
}

// Camera Controls Component
function CameraController({ targetPosition }: { targetPosition: [number, number, number] }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...targetPosition);
      controlsRef.current.update();
    }
  }, [targetPosition]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={200}
      maxPolarAngle={Math.PI / 2 - 0.1}
    />
  );
}

// Main Component
export function FloorPlan3DViewer({
  planId,
  deckHeight = 10,
  wallThickness = 0.5
}: FloorPlan3DViewerProps) {
  const [walls, setWalls] = useState<WallData[]>([]);
  const [doors, setDoors] = useState<DoorData[]>([]);
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [height, setHeight] = useState(deckHeight);
  const [thickness, setThickness] = useState(wallThickness);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [visibleWallTypes, setVisibleWallTypes] = useState<Set<string>>(new Set());
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([50, 40, 50]);

  // Load takeoff data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('takeoff_data')
        .select('*')
        .eq('plan_id', planId);

      if (!error && data) {
        // Parse dimensions
        const parsedData = data.map(item => ({
          ...item,
          dimensions: typeof item.dimensions === 'string'
            ? JSON.parse(item.dimensions)
            : item.dimensions
        }));

        // Separate by type
        const wallItems = parsedData.filter(i => i.item_type === 'wall' && i.dimensions?.coordinates);
        const doorItems = parsedData.filter(i => i.item_type === 'door' && i.dimensions?.coordinates);
        const windowItems = parsedData.filter(i => i.item_type === 'window' && i.dimensions?.coordinates);

        setWalls(wallItems);
        setDoors(doorItems);
        setWindows(windowItems);

        // Initialize visible wall types
        const types = new Set<string>();
        wallItems.forEach(w => types.add(w.wall_type || 'default'));
        setVisibleWallTypes(types);

        // Calculate camera position based on data bounds
        if (wallItems.length > 0) {
          let sumX = 0, sumZ = 0, count = 0;
          wallItems.forEach(wall => {
            if (wall.dimensions?.coordinates?.points) {
              wall.dimensions.coordinates.points.forEach((p: { x: number; y: number }) => {
                sumX += (p.x / 1000) * 100;
                sumZ += (p.y / 1000) * 100;
                count++;
              });
            }
          });
          if (count > 0) {
            const centerX = sumX / count;
            const centerZ = sumZ / count;
            setCameraPosition([centerX + 30, 30, centerZ + 30]);
          }
        }

        console.log('Loaded 3D data:', wallItems.length, 'walls,', doorItems.length, 'doors,', windowItems.length, 'windows');
      }

      setLoading(false);
    };

    if (planId) loadData();
  }, [planId]);

  // Toggle wall type visibility
  const toggleWallType = (type: string) => {
    setVisibleWallTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Get unique wall types
  const wallTypes = useMemo(() => {
    const types = new Map<string, { count: number; totalLF: number; color: string }>();
    walls.forEach(wall => {
      const type = wall.wall_type || 'default';
      const existing = types.get(type) || { count: 0, totalLF: 0, color: getWallColor(type) };
      existing.count++;
      existing.totalLF += wall.quantity || 0;
      types.set(type, existing);
    });
    return types;
  }, [walls]);

  // Reset camera
  const resetCamera = () => {
    setCameraPosition([50, 40, 50]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (walls.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Box className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">No 3D Data Available</h3>
        <p className="text-muted-foreground text-sm">
          Extract takeoff data with coordinates from a floor plan to generate a 3D model.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Controls */}
      <div className="w-72 border-r bg-background flex flex-col">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">3D Model Controls</h3>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Deck Height */}
            <div>
              <label className="text-sm font-medium">Deck Height: {height} ft</label>
              <Slider
                value={[height]}
                onValueChange={([v]) => setHeight(v)}
                min={8}
                max={20}
                step={0.5}
                className="mt-2"
              />
            </div>

            {/* Wall Thickness */}
            <div>
              <label className="text-sm font-medium">Wall Thickness: {thickness} ft</label>
              <Slider
                value={[thickness]}
                onValueChange={([v]) => setThickness(v)}
                min={0.25}
                max={1}
                step={0.125}
                className="mt-2"
              />
            </div>

            {/* View Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">View Options</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={showGrid ? 'default' : 'outline'}
                  onClick={() => setShowGrid(!showGrid)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={showLabels ? 'default' : 'outline'}
                  onClick={() => setShowLabels(!showLabels)}
                >
                  <Layers className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={resetCamera}>
                  <Home className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Wall Types */}
            <div>
              <label className="text-sm font-medium mb-2 block">Wall Types</label>
              <div className="space-y-1">
                {Array.from(wallTypes.entries()).map(([type, data]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm"
                    onClick={() => toggleWallType(type)}
                  >
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor: visibleWallTypes.has(type) ? data.color : 'transparent',
                        borderColor: data.color
                      }}
                    />
                    <span className="flex-1">
                      {type === 'default' ? 'Untyped' : `Type ${type}`}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {data.totalLF.toFixed(0)} LF
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Model Stats</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Walls: {walls.length}</p>
                <p>Doors: {doors.length}</p>
                <p>Windows: {windows.length}</p>
                <p>Total LF: {walls.reduce((sum, w) => sum + (w.quantity || 0), 0).toFixed(0)}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 bg-gray-100">
        <Canvas shadows camera={{ position: cameraPosition, fov: 50 }}>
          <PerspectiveCamera makeDefault position={cameraPosition} />
          <CameraController targetPosition={[cameraPosition[0] - 30, 0, cameraPosition[2] - 30]} />

          <Scene
            walls={walls}
            doors={doors}
            windows={windows}
            deckHeight={height}
            wallThickness={thickness}
            showGrid={showGrid}
            showLabels={showLabels}
            visibleWallTypes={visibleWallTypes}
          />
        </Canvas>
      </div>
    </div>
  );
}

export default FloorPlan3DViewer;
