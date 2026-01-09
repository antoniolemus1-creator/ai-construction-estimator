import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricData {
  epoch: number;
  accuracy: number;
  val_accuracy: number;
  loss: number;
  val_loss: number;
}

interface TrainingMetricsChartProps {
  data: MetricData[];
}

export function TrainingMetricsChart({ data }: TrainingMetricsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="accuracy" stroke="#10b981" name="Training Accuracy" />
            <Line type="monotone" dataKey="val_accuracy" stroke="#3b82f6" name="Validation Accuracy" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
