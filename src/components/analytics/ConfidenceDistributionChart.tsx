import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfidenceDistributionChartProps {
  data: Array<{ range: string; count: number; verified: number; incorrect: number }>;
}

export function ConfidenceDistributionChart({ data }: ConfidenceDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Confidence Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="verified" fill="#10b981" name="Verified" />
            <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
