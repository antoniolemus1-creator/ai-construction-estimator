import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UserActivityChartProps {
  data: Array<{ user: string; validated: number; corrected: number; flagged: number }>;
}

export function UserActivityChart({ data }: UserActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Validation Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="user" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="validated" fill="#10b981" name="Validated" />
            <Bar dataKey="corrected" fill="#f59e0b" name="Corrected" />
            <Bar dataKey="flagged" fill="#ef4444" name="Flagged" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
