import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';

export interface DrywallSection {
  id: string;
  name: string;
  linearFootage: string;
  height: string;
  thickness: string;
  drywallType: string;
  aboveCeiling: string;
}

interface Props {
  sections: DrywallSection[];
  onChange: (sections: DrywallSection[]) => void;
}

export function DrywallForm({ sections, onChange }: Props) {
  const updateSection = (id: string, field: string, value: string) => {
    onChange(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const duplicateSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      onChange([...sections, { ...section, id: Date.now().toString(), name: section.name + ' (Copy)' }]);
    }
  };

  const deleteSection = (id: string) => {
    if (sections.length > 1) onChange(sections.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => (
        <div key={section.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Drywall Section {idx + 1}</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => duplicateSection(section.id)}><Copy className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => deleteSection(section.id)} disabled={sections.length === 1}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={section.name} onChange={(e) => updateSection(section.id, 'name', e.target.value)} /></div>
            <div><Label>Linear Footage</Label><Input type="number" value={section.linearFootage} onChange={(e) => updateSection(section.id, 'linearFootage', e.target.value)} /></div>
            <div><Label>Height (ft)</Label><Input type="number" value={section.height} onChange={(e) => updateSection(section.id, 'height', e.target.value)} /></div>
            <div><Label>Thickness</Label><Select value={section.thickness} onValueChange={(v) => updateSection(section.id, 'thickness', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0.5">1/2"</SelectItem><SelectItem value="0.625">5/8"</SelectItem><SelectItem value="0.75">3/4"</SelectItem><SelectItem value="1">1"</SelectItem></SelectContent></Select></div>
            <div><Label>Drywall Type</Label><Select value={section.drywallType} onValueChange={(v) => updateSection(section.id, 'drywallType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Standard">Standard</SelectItem><SelectItem value="Moisture Resistant">Moisture Resistant</SelectItem><SelectItem value="Type X">Type X</SelectItem><SelectItem value="Type C">Type C</SelectItem><SelectItem value="Bulletproof">Bulletproof</SelectItem></SelectContent></Select></div>
            <div><Label>Above Ceiling</Label><Select value={section.aboveCeiling} onValueChange={(v) => updateSection(section.id, 'aboveCeiling', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="accessible">Accessible</SelectItem><SelectItem value="not-accessible">Not Accessible</SelectItem></SelectContent></Select></div>
          </div>
        </div>
      ))}
    </div>
  );
}
