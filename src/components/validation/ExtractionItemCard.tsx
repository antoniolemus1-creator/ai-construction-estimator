import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Flag, Edit2, Save, X } from 'lucide-react';
import { ValidationStatusBadge } from './ValidationStatusBadge';
import { useState } from 'react';

interface ExtractionItemCardProps {
  item: any;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onStatusChange: (status: string) => void;
  onFlag: () => void;
  onUpdate: (data: any) => void;
}

export function ExtractionItemCard({ item, selected, onSelect, onStatusChange, onFlag, onUpdate }: ExtractionItemCardProps) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(item.original_data);

  const handleSave = () => {
    onUpdate(editData);
    setEditing(false);
  };

  return (
    <Card className={`p-4 ${selected ? 'ring-2 ring-primary' : ''}`}>
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onSelect} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{item.extraction_type}</h4>
            <ValidationStatusBadge status={item.validation_status} />
          </div>
          {editing ? (
            <div className="space-y-2">
              {Object.entries(editData).map(([key, value]) => (
                <Input
                  key={key}
                  value={value as string}
                  onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                  placeholder={key}
                />
              ))}
            </div>
          ) : (
            <div className="text-sm space-y-1">
              {Object.entries(item.original_data).map(([key, value]) => (
                <div key={key}><span className="font-medium">{key}:</span> {String(value)}</div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave}><Save className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit2 className="w-4 h-4" /></Button>
            )}
            <Button size="sm" variant="outline" onClick={onFlag}><Flag className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
