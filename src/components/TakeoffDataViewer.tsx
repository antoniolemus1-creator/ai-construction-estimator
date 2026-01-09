import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Ruler, Square, DoorOpen, Grid3x3, FileText, MapPin, Hash, Calendar } from 'lucide-react';

interface TakeoffDataViewerProps {
  planId: string;
}

export function TakeoffDataViewer({ planId }: TakeoffDataViewerProps) {
  const [takeoffData, setTakeoffData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTakeoffData();
  }, [planId]);

  const loadTakeoffData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('takeoff_data')
      .select('*')
      .eq('plan_id', planId)
      .order('item_type', { ascending: true });
    setTakeoffData(data || []);
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'wall': return <Ruler className="w-4 h-4" />;
      case 'ceiling': return <Square className="w-4 h-4" />;
      case 'door': return <DoorOpen className="w-4 h-4" />;
      case 'window': return <Grid3x3 className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (!score) return 'bg-gray-500';
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) return <div className="text-center py-8">Loading takeoff data...</div>;
  if (takeoffData.length === 0) return <div className="text-center py-8 text-muted-foreground">No takeoff data yet. Run AI Vision extraction first.</div>;

  const projectInfo = takeoffData[0];
  const walls = takeoffData.filter(d => d.item_type === 'wall');
  const ceilings = takeoffData.filter(d => d.item_type === 'ceiling');
  const doors = takeoffData.filter(d => d.item_type === 'door');
  const windows = takeoffData.filter(d => d.item_type === 'window');
  const rooms = takeoffData.filter(d => d.item_type === 'room');

  return (
    <div className="space-y-6">
      {/* Project & Drawing Metadata */}
      {projectInfo && (
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project & Drawing Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectInfo.project_name && (
              <div>
                <div className="text-sm text-muted-foreground">Project Name</div>
                <div className="font-semibold">{projectInfo.project_name}</div>
              </div>
            )}
            {projectInfo.project_address && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address
                </div>
                <div className="font-semibold">{projectInfo.project_address}</div>
              </div>
            )}
            {projectInfo.project_number && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Project Number
                </div>
                <div className="font-semibold">{projectInfo.project_number}</div>
              </div>
            )}
            {projectInfo.architect && (
              <div>
                <div className="text-sm text-muted-foreground">Architect</div>
                <div className="font-semibold">{projectInfo.architect}</div>
              </div>
            )}
            {projectInfo.engineer && (
              <div>
                <div className="text-sm text-muted-foreground">Engineer</div>
                <div className="font-semibold">{projectInfo.engineer}</div>
              </div>
            )}
            {projectInfo.sheet_number && (
              <div>
                <div className="text-sm text-muted-foreground">Sheet Number</div>
                <div className="font-semibold">{projectInfo.sheet_number}</div>
              </div>
            )}
            {projectInfo.sheet_title && (
              <div>
                <div className="text-sm text-muted-foreground">Sheet Title</div>
                <div className="font-semibold">{projectInfo.sheet_title}</div>
              </div>
            )}
            {projectInfo.drawing_scale && (
              <div>
                <div className="text-sm text-muted-foreground">Drawing Scale</div>
                <div className="font-semibold">{projectInfo.drawing_scale}</div>
              </div>
            )}
            {projectInfo.revision_number && (
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Revision
                </div>
                <div className="font-semibold">
                  {projectInfo.revision_number}
                  {projectInfo.revision_date && ` (${projectInfo.revision_date})`}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Takeoff Data Tabs */}
      <Card className="p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({takeoffData.length})</TabsTrigger>
            <TabsTrigger value="walls">Walls ({walls.length})</TabsTrigger>
            <TabsTrigger value="ceilings">Ceilings ({ceilings.length})</TabsTrigger>
            <TabsTrigger value="doors">Doors ({doors.length})</TabsTrigger>
            <TabsTrigger value="windows">Windows ({windows.length})</TabsTrigger>
            <TabsTrigger value="rooms">Rooms ({rooms.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <DataTable data={takeoffData} getIcon={getIcon} getConfidenceColor={getConfidenceColor} />
          </TabsContent>
          <TabsContent value="walls">
            <DataTable data={walls} getIcon={getIcon} getConfidenceColor={getConfidenceColor} />
          </TabsContent>
          <TabsContent value="ceilings">
            <DataTable data={ceilings} getIcon={getIcon} getConfidenceColor={getConfidenceColor} />
          </TabsContent>
          <TabsContent value="doors">
            <DataTable data={doors} getIcon={getIcon} getConfidenceColor={getConfidenceColor} />
          </TabsContent>
          <TabsContent value="windows">
            <DataTable data={windows} getIcon={getIcon} getConfidenceColor={getConfidenceColor} />
          </TabsContent>
          <TabsContent value="rooms">
            <DataTable data={rooms} getIcon={getIcon} getConfidenceColor={getConfidenceColor} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function DataTable({ data, getIcon, getConfidenceColor }: any) {
  if (data.length === 0) return <div className="text-center py-8 text-muted-foreground">No items in this category</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Notes</TableHead>
          <TableHead>Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item: any) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {getIcon(item.item_type)}
                <span className="capitalize">{item.item_type}</span>
              </div>
            </TableCell>
            <TableCell>
              <div>
                {item.room_name && <div className="font-medium">{item.room_name}</div>}
                {item.room_number && <div className="text-xs text-muted-foreground">#{item.room_number}</div>}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {item.wall_type && <div className="text-sm">{item.wall_type}</div>}
                {item.ceiling_type && <div className="text-sm">{item.ceiling_type}</div>}
                {item.door_type && <div className="text-sm">{item.door_type}</div>}
                {item.window_type && <div className="text-sm">{item.window_type}</div>}
                {item.dimensions && <div className="text-xs text-muted-foreground">{item.dimensions}</div>}
              </div>
            </TableCell>
            <TableCell className="font-mono">{item.quantity?.toFixed(2)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
            <TableCell className="text-xs max-w-xs truncate">{item.notes}</TableCell>
            <TableCell>
              {item.confidence_score && (
                <Badge className={getConfidenceColor(item.confidence_score)}>
                  {(item.confidence_score * 100).toFixed(0)}%
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
