import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AccuracyTrendChartProps {
  data: Array<{ date: string; accuracy: number; totalValidations: number }>;
}

export function AccuracyTrendChart({ data }: AccuracyTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accuracy Trend Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Accuracy %" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
