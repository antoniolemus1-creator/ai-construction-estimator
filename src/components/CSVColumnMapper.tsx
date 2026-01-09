import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CSVColumnMapperProps {
  csvHeaders: string[];
  systemFields: { key: string; label: string; required: boolean }[];
  mappings: Record<string, string>;
  onMappingChange: (systemField: string, csvColumn: string) => void;
}

export function CSVColumnMapper({ csvHeaders, systemFields, mappings, onMappingChange }: CSVColumnMapperProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Map Your Columns</h3>
      <div className="grid gap-4">
        {systemFields.map((field) => (
          <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
            <Label className="text-right">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={mappings[field.key] || ''}
              onValueChange={(value) => onMappingChange(field.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">-- None --</SelectItem>
                {csvHeaders.map((header) => (
                  <SelectItem key={header} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
