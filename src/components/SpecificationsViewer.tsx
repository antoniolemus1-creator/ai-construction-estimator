import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { FileText, Package, Wrench, ClipboardCheck } from 'lucide-react';

interface Specification {
  id: string;
  section_number: string;
  section_title: string;
  division: string;
  material_name: string;
  manufacturer: string;
  model_number: string;
  installation_method: string;
  quality_standards: string[];
  submittals_required: boolean;
  testing_requirements: string;
  warranty_requirements: string;
  page_number: number;
}

interface SpecificationsViewerProps {
  planUploadId: string;
}

export function SpecificationsViewer({ planUploadId }: SpecificationsViewerProps) {
  const [specs, setSpecs] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecs();
  }, [planUploadId]);

  const loadSpecs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('specifications')
      .select('*')
      .eq('plan_upload_id', planUploadId)
      .order('section_number', { ascending: true });

    if (!error && data) {
      setSpecs(data);
    }
    setLoading(false);
  };

  const groupByDivision = () => {
    const grouped: Record<string, Specification[]> = {};
    specs.forEach(spec => {
      const div = spec.division || 'Unknown';
      if (!grouped[div]) grouped[div] = [];
      grouped[div].push(spec);
    });
    return grouped;
  };

  if (loading) return <div className="p-4">Loading specifications...</div>;
  if (specs.length === 0) return <div className="p-4 text-gray-500">No specifications extracted yet.</div>;

  const grouped = groupByDivision();

  return (
    <div className="space-y-4">
      <Tabs defaultValue={Object.keys(grouped)[0]} className="w-full">
        <TabsList>
          {Object.keys(grouped).map(division => (
            <TabsTrigger key={division} value={division}>
              {division}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(grouped).map(([division, divSpecs]) => (
          <TabsContent key={division} value={division} className="space-y-4">
            {divSpecs.map(spec => (
              <Card key={spec.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{spec.section_number}</Badge>
                      <Badge>Page {spec.page_number}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{spec.section_title}</h3>
                  </div>
                  <FileText className="h-5 w-5 text-gray-400" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm">Material</span>
                    </div>
                    <p className="text-sm">{spec.material_name}</p>
                    {spec.manufacturer && (
                      <p className="text-xs text-gray-600 mt-1">
                        {spec.manufacturer} {spec.model_number && `- ${spec.model_number}`}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-sm">Installation</span>
                    </div>
                    <p className="text-sm">{spec.installation_method || 'Not specified'}</p>
                  </div>

                  {spec.quality_standards && spec.quality_standards.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Standards</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {spec.quality_standards.map((std, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{std}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-sm">Requirements</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {spec.submittals_required && <Badge variant="outline">Submittals Required</Badge>}
                      {spec.testing_requirements && <Badge variant="outline">Testing Required</Badge>}
                      {spec.warranty_requirements && <Badge variant="outline">Warranty Required</Badge>}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}