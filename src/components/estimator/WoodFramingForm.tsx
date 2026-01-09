import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';

export interface WoodFramingSection {
  id: string;
  name: string;
  linearFootage: string;
  height: string;
  onCenter: string;
  customOnCenter: string;
  plates: string;
  woodType: string;
}

interface Props {
  sections: WoodFramingSection[];
  onChange: (sections: WoodFramingSection[]) => void;
}

export function WoodFramingForm({ sections, onChange }: Props) {
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
            <h4 className="font-medium">Wood Framing Section {idx + 1}</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => duplicateSection(section.id)}><Copy className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => deleteSection(section.id)} disabled={sections.length === 1}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={section.name} onChange={(e) => updateSection(section.id, 'name', e.target.value)} /></div>
            <div><Label>Linear Footage</Label><Input type="number" value={section.linearFootage} onChange={(e) => updateSection(section.id, 'linearFootage', e.target.value)} /></div>
            <div><Label>Height (ft)</Label><Input type="number" value={section.height} onChange={(e) => updateSection(section.id, 'height', e.target.value)} /></div>
            <div><Label>On Center</Label><Select value={section.onCenter} onValueChange={(v) => updateSection(section.id, 'onCenter', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="16">16"</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent></Select></div>
            {section.onCenter === 'custom' && <div><Label>Custom (inches)</Label><Input type="number" value={section.customOnCenter} onChange={(e) => updateSection(section.id, 'customOnCenter', e.target.value)} /></div>}
            <div><Label>Number of Plates</Label><Input type="number" value={section.plates} onChange={(e) => updateSection(section.id, 'plates', e.target.value)} /></div>
            <div><Label>Wood Type</Label><Select value={section.woodType} onValueChange={(v) => updateSection(section.id, 'woodType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Standard">Standard</SelectItem><SelectItem value="Fire-Rated">Fire-Rated</SelectItem><SelectItem value="Pressure Treated">Pressure Treated</SelectItem></SelectContent></Select></div>
          </div>
        </div>
      ))}
    </div>
  );
}
