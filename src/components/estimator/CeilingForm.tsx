import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';

export interface CeilingSection {
  id: string;
  name: string;
  squareFootage: string;
  type: string;
}

interface Props {
  sections: CeilingSection[];
  onChange: (sections: CeilingSection[]) => void;
}

export function CeilingForm({ sections, onChange }: Props) {
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
            <h4 className="font-medium">Ceiling Section {idx + 1}</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => duplicateSection(section.id)}><Copy className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => deleteSection(section.id)} disabled={sections.length === 1}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={section.name} onChange={(e) => updateSection(section.id, 'name', e.target.value)} />
            </div>
            <div>
              <Label>Square Footage</Label>
              <Input type="number" value={section.squareFootage} onChange={(e) => updateSection(section.id, 'squareFootage', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Type</Label>
              <Select value={section.type} onValueChange={(v) => updateSection(section.id, 'type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACT High End">ACT High End</SelectItem>
                  <SelectItem value="ACT Low End">ACT Low End</SelectItem>
                  <SelectItem value="Metal Framed">Metal Framed</SelectItem>
                  <SelectItem value="Wood Framed">Wood Framed</SelectItem>
                  <SelectItem value="Drywall Grid">Drywall Grid</SelectItem>
                  <SelectItem value="Specialty">Specialty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
