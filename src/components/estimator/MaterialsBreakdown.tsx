import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface Props {
  materials: MaterialItem[];
}

export function MaterialsBreakdown({ materials }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="mt-4">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Detailed Materials Breakdown</CardTitle>
          <Button variant="ghost" size="sm">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 font-semibold">Material</th>
                  <th className="pb-2 font-semibold text-right">Quantity</th>
                  <th className="pb-2 font-semibold text-right">Unit Price</th>
                  <th className="pb-2 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-right">{item.quantity.toFixed(2)} {item.unit}</td>
                    <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
