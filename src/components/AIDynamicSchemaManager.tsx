import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plus, Table, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface DynamicSchema {
  id: string;
  table_name: string;
  schema_definition: any;
  created_at: string;
  is_active: boolean;
}

interface SchemaAnalysis {
  standard_elements: any;
  mep_elements: any;
  structural_elements: any;
  custom_elements: any;
  suggested_tables: Array<{
    table_name: string;
    columns: Array<{ name: string; type: string; description: string }>;
    purpose: string;
  }>;
}

export default function AIDynamicSchemaManager({ planId, imageUrl, pageNumber }: any) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SchemaAnalysis | null>(null);
  const [schemas, setSchemas] = useState<DynamicSchema[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [createdTables, setCreatedTables] = useState<any[]>([]);

  useEffect(() => {
    loadExistingSchemas();
  }, [planId]);

  const loadExistingSchemas = async () => {
    const { data } = await supabase
      .from('ai_created_schemas')
      .select('*')
      .eq('plan_id', planId)
      .eq('is_active', true);
    
    if (data) setSchemas(data);
  };

  const analyzeSchema = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-dynamic-schema', {
        body: {
          action: 'analyze_schema_needs',
          planId,
          imageUrl,
          pageNumber
        }
      });

      if (error) throw error;
      
      setAnalysis(data.analysis);
      toast.success('AI analysis complete! Found specialized data types.');
    } catch (error: any) {
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createSelectedTables = async () => {
    if (selectedTables.length === 0) {
      toast.error('Please select tables to create');
      return;
    }

    setLoading(true);
    try {
      const tables = analysis?.suggested_tables.filter(t => 
        selectedTables.includes(t.table_name)
      );

      const { data, error } = await supabase.functions.invoke('ai-dynamic-schema', {
        body: {
          action: 'create_dynamic_tables',
          planId,
          tables
        }
      });

      if (error) throw error;
      
      setCreatedTables(data.createdTables);
      toast.success(`Created ${data.createdTables.length} custom tables!`);
      loadExistingSchemas();
    } catch (error: any) {
      toast.error('Failed to create tables: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const extractToCustomTable = async (table: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-dynamic-schema', {
        body: {
          action: 'extract_to_dynamic_schema',
          targetTable: table,
          imageUrl,
          pageNumber,
          planId
        }
      });

      if (error) throw error;
      
      toast.success(`Extracted ${data.itemsExtracted} items to ${table.original_name}`);
    } catch (error: any) {
      toast.error('Extraction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Dynamic Schema Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analyze">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="create">Create Tables</TabsTrigger>
            <TabsTrigger value="extract">Extract Data</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                AI will analyze your plans and identify ALL data types present, including MEP, structural, and custom elements beyond standard takeoff items.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={analyzeSchema} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Database className="mr-2 h-4 w-4" /> Analyze Plan for Data Types</>
              )}
            </Button>

            {analysis && (
              <div className="space-y-4 mt-4">
                <h3 className="font-semibold">Detected Elements:</h3>
                
                {analysis.suggested_tables.map((table) => (
                  <Card key={table.table_name}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{table.table_name}</h4>
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(table.table_name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTables([...selectedTables, table.table_name]);
                            } else {
                              setSelectedTables(selectedTables.filter(t => t !== table.table_name));
                            }
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{table.purpose}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs space-y-1">
                        {table.columns.map((col) => (
                          <div key={col.name} className="flex justify-between">
                            <span className="font-mono">{col.name}</span>
                            <span className="text-muted-foreground">{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            {selectedTables.length > 0 ? (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Ready to create {selectedTables.length} custom table(s) for specialized data extraction.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={createSelectedTables}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Tables...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" /> Create Selected Tables</>
                  )}
                </Button>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  Please analyze the plan first and select tables to create.
                </AlertDescription>
              </Alert>
            )}

            {createdTables.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Created Tables:</h3>
                {createdTables.map((table) => (
                  <Card key={table.name}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{table.original_name}</span>
                        <Button
                          size="sm"
                          onClick={() => extractToCustomTable(table)}
                          disabled={loading}
                        >
                          Extract Data
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="extract" className="space-y-4">
            <h3 className="font-semibold">Existing Custom Tables:</h3>
            {schemas.length > 0 ? (
              schemas.map((schema) => (
                <Card key={schema.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{schema.schema_definition.table_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(schema.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => extractToCustomTable({
                          name: schema.table_name,
                          original_name: schema.schema_definition.table_name,
                          columns: schema.schema_definition.columns
                        })}
                      >
                        <Table className="mr-2 h-4 w-4" />
                        Re-extract
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert>
                <AlertDescription>
                  No custom tables created yet. Analyze and create tables first.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}