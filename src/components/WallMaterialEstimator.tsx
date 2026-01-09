import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Calculator, Download, FileSpreadsheet, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import {
  WallTypeSpec,
  WallInput,
  UserInputs,
  WallMaterialReport,
  generateMaterialReport,
  parseWallMaterials
} from '@/lib/wallMaterialCalculator';
import { exportWallTakeoffToExcel, WallTakeoffRow, WallTypeLegendRow } from '@/lib/excelExport';

interface WallMaterialEstimatorProps {
  planId: string;
  projectName?: string;
}

interface ClarificationQuestion {
  id: string;
  question_type: string;
  question_text: string;
  context: string;
  affects_items: string[];
  answer_text: string | null;
}

interface TakeoffDataItem {
  id: string;
  item_type: string;
  wall_type: string | null;
  quantity: number;
  unit: string;
  room_name: string | null;
  description: string | null;
  notes: string | null;
  linear_footage: number | null;
  wall_materials: string | null;
  dimensions: string | null;
}

const DRYWALL_TYPES = [
  { value: 'regular', label: 'Regular (White Board)' },
  { value: 'type_x', label: 'Type X (Fire Rated)' },
  { value: 'type_c', label: 'Type C (Enhanced Fire)' },
  { value: 'moisture_resistant', label: 'Moisture Resistant (Green Board)' },
  { value: 'mold_resistant', label: 'Mold Resistant (Purple Board)' },
  { value: 'abuse_resistant', label: 'Abuse Resistant (High Impact)' },
];

const STUD_GAUGES = [
  { value: '25', label: '25 Gauge (Light)' },
  { value: '22', label: '22 Gauge (Standard)' },
  { value: '20', label: '20 Gauge (Heavy)' },
  { value: '18', label: '18 Gauge (Structural)' },
  { value: '16', label: '16 Gauge (Load Bearing)' },
];

const FINISH_LEVELS = [
  { value: '0', label: 'Level 0 - No Finish' },
  { value: '1', label: 'Level 1 - Fire Tape Only' },
  { value: '2', label: 'Level 2 - Tape & First Coat' },
  { value: '3', label: 'Level 3 - Tape & Two Coats' },
  { value: '4', label: 'Level 4 - Standard (Most Common)' },
  { value: '5', label: 'Level 5 - Smooth Wall/Skim Coat' },
];

const PAINT_TYPES = [
  { value: 'flat', label: 'Flat/Matte' },
  { value: 'eggshell', label: 'Eggshell' },
  { value: 'satin', label: 'Satin' },
  { value: 'semi_gloss', label: 'Semi-Gloss' },
  { value: 'gloss', label: 'High Gloss' },
];

export function WallMaterialEstimator({ planId, projectName = 'Project' }: WallMaterialEstimatorProps) {
  const [loading, setLoading] = useState(true);
  const [takeoffData, setTakeoffData] = useState<TakeoffDataItem[]>([]);
  const [clarifications, setClarifications] = useState<ClarificationQuestion[]>([]);
  const [materialReport, setMaterialReport] = useState<WallMaterialReport | null>(null);

  // User inputs for material calculation
  const [userInputs, setUserInputs] = useState<UserInputs>({
    deckHeight: 10,
    studGauge: 25,
    drywallType: 'regular',
    drywallThickness: '5/8',
    finishLevel: 4,
    paintType: 'eggshell',
    paintCoats: 2,
    wasteFactor: 10
  });

  // Load takeoff data and clarification questions
  useEffect(() => {
    async function loadData() {
    setLoading(true);
    try {
      // Load wall takeoff data
      const { data: walls, error: wallError } = await supabase
        .from('takeoff_data')
        .select('*')
        .eq('plan_id', planId)
        .in('item_type', ['wall', 'wall_type_legend', 'wall_type_total'])
        .order('wall_type', { ascending: true });

      if (wallError) throw wallError;
      setTakeoffData(walls || []);

      // Load clarification questions
      const { data: questions, error: qError } = await supabase
        .from('ai_clarification_questions')
        .select('*')
        .eq('plan_id', planId)
        .is('answer_text', null)
        .order('created_at', { ascending: true });

      if (!qError && questions) {
        setClarifications(questions);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
    }
    loadData();
  }, [planId]);

  // Parse data into separate categories
  const { wallTypeLegend, walls, wallTypeTotals } = useMemo(() => {
    const legend: WallTypeLegendRow[] = [];
    const wallList: WallTakeoffRow[] = [];
    const totals: { typeCode: string; totalLF: number; count: number }[] = [];

    for (const item of takeoffData) {
      if (item.item_type === 'wall_type_legend') {
        const materials = parseWallMaterials(item.wall_materials);
        legend.push({
          typeCode: item.wall_type || '',
          description: item.description || '',
          composition: materials.composition as string,
          studSize: materials.studSize as string,
          studSpacing: materials.studSpacing as string,
          fireRating: materials.fireRating as string,
          stcRating: materials.stcRating as number,
          layers: materials.layersEachSide as number,
          drywallType: materials.drywallType as string
        });
      } else if (item.item_type === 'wall') {
        wallList.push({
          wallType: item.wall_type || 'Unknown',
          linearFootage: item.linear_footage || item.quantity || 0,
          roomName: item.room_name || '',
          description: item.description || undefined,
          notes: item.notes || undefined
        });
      } else if (item.item_type === 'wall_type_total') {
        totals.push({
          typeCode: item.wall_type || '',
          totalLF: item.linear_footage || item.quantity || 0,
          count: parseInt(item.notes?.match(/(\d+) wall/)?.[1] || '0')
        });
      }
    }

    return { wallTypeLegend: legend, walls: wallList, wallTypeTotals: totals };
  }, [takeoffData]);

  // Calculate materials when user clicks calculate
  function calculateMaterials() {
    // Build wall specs from legend
    const wallSpecs = new Map<string, WallTypeSpec>();
    for (const legend of wallTypeLegend) {
      wallSpecs.set(legend.typeCode, {
        typeCode: legend.typeCode,
        description: legend.description,
        studSize: legend.studSize || '3-5/8"',
        studSpacing: parseInt(legend.studSpacing?.replace(/[^\d]/g, '') || '16'),
        studGauge: userInputs.studGauge,
        layersEachSide: legend.layers || 1,
        drywallType: legend.drywallType || userInputs.drywallType,
        drywallThickness: userInputs.drywallThickness,
        fireRating: legend.fireRating || null,
        insulation: false
      });
    }

    // Build wall inputs from totals
    const wallInputs: WallInput[] = wallTypeTotals.map(wt => ({
      wallTypeCode: wt.typeCode,
      linearFootage: wt.totalLF,
      deckHeight: userInputs.deckHeight
    }));

    // Generate report
    const report = generateMaterialReport(wallInputs, wallSpecs, userInputs);
    setMaterialReport(report);
  }

  // Export to Excel
  function handleExport() {
    exportWallTakeoffToExcel(
      projectName,
      walls,
      wallTypeLegend,
      wallTypeTotals,
      materialReport || undefined
    );
  }

  // Answer a clarification question
  async function answerQuestion(questionId: string, answer: string) {
    const { error } = await supabase
      .from('ai_clarification_questions')
      .update({
        answer_text: answer,
        answered_at: new Date().toISOString()
      })
      .eq('id', questionId);

    if (!error) {
      setClarifications(prev => prev.filter(q => q.id !== questionId));
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">Loading wall data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Clarification Questions Alert */}
      {clarifications.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">{clarifications.length} questions</span> need your input for accurate material calculations.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Wall Summary</TabsTrigger>
          <TabsTrigger value="details">Wall Details</TabsTrigger>
          <TabsTrigger value="inputs">
            Estimate Inputs
            {clarifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">{clarifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="materials">Material Quantities</TabsTrigger>
        </TabsList>

        {/* Wall Type Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Wall Type Summary
              </CardTitle>
              <CardDescription>
                Total linear footage by wall type extracted from plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wallTypeTotals.length === 0 ? (
                <p className="text-muted-foreground">No wall data extracted yet. Run extraction on plan pages first.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wall Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Linear Ft</TableHead>
                      <TableHead className="text-right">Wall Count</TableHead>
                      <TableHead>Fire Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallTypeTotals.map((wt, idx) => {
                      const legend = wallTypeLegend.find(l => l.typeCode === wt.typeCode);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{wt.typeCode}</TableCell>
                          <TableCell>{legend?.description || '-'}</TableCell>
                          <TableCell className="text-right font-mono">{wt.totalLF.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{wt.count}</TableCell>
                          <TableCell>
                            {legend?.fireRating ? (
                              <Badge variant="secondary">{legend.fireRating}</Badge>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-mono">
                        {wallTypeTotals.reduce((sum, wt) => sum + wt.totalLF, 0).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {wallTypeTotals.reduce((sum, wt) => sum + wt.count, 0)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wall Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Individual Wall Segments</CardTitle>
              <CardDescription>
                Detailed breakdown of each wall measured from plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {walls.length === 0 ? (
                <p className="text-muted-foreground">No individual wall data available.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wall Type</TableHead>
                      <TableHead>Room/Location</TableHead>
                      <TableHead className="text-right">Linear Ft</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walls.slice(0, 50).map((wall, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{wall.wallType}</TableCell>
                        <TableCell>{wall.roomName}</TableCell>
                        <TableCell className="text-right font-mono">{wall.linearFootage.toFixed(1)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{wall.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {walls.length > 50 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing 50 of {walls.length} walls. Export to Excel to see all.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Inputs Tab */}
        <TabsContent value="inputs">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Clarification Questions */}
            {clarifications.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Questions from AI
                  </CardTitle>
                  <CardDescription>
                    Answer these questions for accurate material calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {clarifications.map((q) => (
                    <div key={q.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">{q.question_type.replace('_', ' ')}</Badge>
                          <p className="font-medium">{q.question_text}</p>
                          {q.context && (
                            <p className="text-sm text-muted-foreground">{q.context}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Your answer..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              answerQuestion(q.id, (e.target as HTMLInputElement).value);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector('input');
                            if (input?.value) answerQuestion(q.id, input.value);
                          }}
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Estimate Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Framing Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Deck Height (ft)</Label>
                  <Input
                    type="number"
                    value={userInputs.deckHeight}
                    onChange={(e) => setUserInputs(prev => ({ ...prev, deckHeight: parseFloat(e.target.value) || 10 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stud Gauge</Label>
                  <Select
                    value={String(userInputs.studGauge)}
                    onValueChange={(v) => setUserInputs(prev => ({ ...prev, studGauge: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUD_GAUGES.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Waste Factor (%)</Label>
                  <Input
                    type="number"
                    value={userInputs.wasteFactor}
                    onChange={(e) => setUserInputs(prev => ({ ...prev, wasteFactor: parseFloat(e.target.value) || 10 }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Drywall Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Drywall Type</Label>
                  <Select
                    value={userInputs.drywallType}
                    onValueChange={(v) => setUserInputs(prev => ({ ...prev, drywallType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DRYWALL_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Drywall Thickness</Label>
                  <Select
                    value={userInputs.drywallThickness}
                    onValueChange={(v) => setUserInputs(prev => ({ ...prev, drywallThickness: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1/2">1/2"</SelectItem>
                      <SelectItem value="5/8">5/8"</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Finish Level</Label>
                  <Select
                    value={String(userInputs.finishLevel)}
                    onValueChange={(v) => setUserInputs(prev => ({ ...prev, finishLevel: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINISH_LEVELS.map(l => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Paint Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Paint Type</Label>
                  <Select
                    value={userInputs.paintType}
                    onValueChange={(v) => setUserInputs(prev => ({ ...prev, paintType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAINT_TYPES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Coats</Label>
                  <Select
                    value={String(userInputs.paintCoats)}
                    onValueChange={(v) => setUserInputs(prev => ({ ...prev, paintCoats: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Coat</SelectItem>
                      <SelectItem value="2">2 Coats</SelectItem>
                      <SelectItem value="3">3 Coats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="pt-6 flex gap-4">
                <Button onClick={calculateMaterials} className="flex-1">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Materials
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Material Quantities Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Material Quantities
              </CardTitle>
              <CardDescription>
                Calculated materials based on wall takeoff and your inputs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!materialReport ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Enter your estimate inputs and click "Calculate Materials" to see quantities.
                  </p>
                  <Button onClick={() => document.querySelector('[value="inputs"]')?.dispatchEvent(new Event('click'))}>
                    Go to Estimate Inputs
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Project Totals */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Linear Ft</p>
                      <p className="text-2xl font-bold">{materialReport.projectTotals.totalLinearFootage.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Square Ft</p>
                      <p className="text-2xl font-bold">{materialReport.projectTotals.totalSquareFootage.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Total Studs</p>
                      <p className="text-2xl font-bold">{materialReport.projectTotals.totalStuds.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Drywall Sheets</p>
                      <p className="text-2xl font-bold">{materialReport.projectTotals.totalDrywallSheets.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Paint (gal)</p>
                      <p className="text-2xl font-bold">{materialReport.projectTotals.totalPaintGallons.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* By Wall Type */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Wall Type</TableHead>
                        <TableHead className="text-right">LF</TableHead>
                        <TableHead className="text-right">SF</TableHead>
                        <TableHead className="text-right">Studs</TableHead>
                        <TableHead className="text-right">Track (LF)</TableHead>
                        <TableHead className="text-right">Drywall</TableHead>
                        <TableHead className="text-right">Mud</TableHead>
                        <TableHead className="text-right">Paint</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialReport.byWallType.map((m, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{m.wallTypeCode}</TableCell>
                          <TableCell className="text-right font-mono">{m.linearFootage.toFixed(0)}</TableCell>
                          <TableCell className="text-right font-mono">{m.squareFootage.toFixed(0)}</TableCell>
                          <TableCell className="text-right font-mono">{m.studs.quantity}</TableCell>
                          <TableCell className="text-right font-mono">{m.topTrack.quantity + m.bottomTrack.quantity}</TableCell>
                          <TableCell className="text-right font-mono">{m.drywall.totalSheets}</TableCell>
                          <TableCell className="text-right font-mono">{m.jointCompound.quantity}</TableCell>
                          <TableCell className="text-right font-mono">{m.paint.gallons}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end">
                    <Button onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Full Report to Excel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
