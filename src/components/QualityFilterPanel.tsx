import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface Props {
  filters: any;
  onFiltersChange: (filters: any) => void;
}

export default function QualityFilterPanel({ filters, onFiltersChange }: Props) {
  return (
    <Card className="p-4 w-64 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4" />
        <span className="font-medium">Filters</span>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-sm">Quality Score Range</Label>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs">{(filters.minQuality * 100).toFixed(0)}%</span>
            <Slider
              value={[filters.minQuality * 100, filters.maxQuality * 100]}
              onValueChange={(values) => 
                onFiltersChange({
                  ...filters,
                  minQuality: values[0] / 100,
                  maxQuality: values[1] / 100
                })
              }
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-xs">{(filters.maxQuality * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">Exclude Duplicates</Label>
          <Switch
            checked={filters.excludeDuplicates}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, excludeDuplicates: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm">Exclude Outliers</Label>
          <Switch
            checked={filters.excludeOutliers}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, excludeOutliers: checked })
            }
          />
        </div>

        <div>
          <Label className="text-sm">Document Type</Label>
          <Select
            value={filters.documentType}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, documentType: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="blueprint">Blueprint</SelectItem>
              <SelectItem value="specification">Specification</SelectItem>
              <SelectItem value="estimate">Estimate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm">Difficulty</Label>
          <Select
            value={filters.difficulty}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, difficulty: value })
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}