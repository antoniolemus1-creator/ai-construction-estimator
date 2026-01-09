import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialsBreakdown } from './MaterialsBreakdown';

interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Props {
  metalFramingCost: number;
  drywallCost: number;
  woodFramingCost: number;
  ceilingCost: number;
  laborCost: number;
  subtotal: number;
  overhead: number;
  profit: number;
  total: number;
  materials?: MaterialItem[];
}

export function EstimateResults({
  metalFramingCost,
  drywallCost,
  woodFramingCost,
  ceilingCost,
  laborCost,
  subtotal,
  overhead,
  profit,
  total,
  materials
}: Props) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Estimate Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Metal Framing:</span>
            <span className="font-semibold">${metalFramingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Drywall:</span>
            <span className="font-semibold">${drywallCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Wood Framing:</span>
            <span className="font-semibold">${woodFramingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Ceiling:</span>
            <span className="font-semibold">${ceilingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Labor:</span>
            <span className="font-semibold">${laborCost.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-blue-600">
            <span>Overhead:</span>
            <span className="font-semibold">${overhead.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Profit:</span>
            <span className="font-semibold">${profit.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between text-lg">
            <span className="font-bold">Total:</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
      {materials && materials.length > 0 && <MaterialsBreakdown materials={materials} />}
    </>
  );
}
