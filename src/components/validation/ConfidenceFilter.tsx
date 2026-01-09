import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface ConfidenceFilterProps {
  minConfidence: number;
  onConfidenceChange: (value: number) => void;
}

export function ConfidenceFilter({ minConfidence, onConfidenceChange }: ConfidenceFilterProps) {
  return (
    <div className="space-y-2">
      <Label>Minimum Confidence: {minConfidence}%</Label>
      <Slider
        value={[minConfidence]}
        onValueChange={(values) => onConfidenceChange(values[0])}
        min={0}
        max={100}
        step={5}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
