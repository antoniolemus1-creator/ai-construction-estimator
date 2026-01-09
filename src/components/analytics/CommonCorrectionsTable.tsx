import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Correction {
  field: string;
  count: number;
  percentage: number;
  commonIssue: string;
}

interface CommonCorrectionsTableProps {
  corrections: Correction[];
}

export function CommonCorrectionsTable({ corrections }: CommonCorrectionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Common Corrections Needed</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead>Corrections</TableHead>
              <TableHead>% of Total</TableHead>
              <TableHead>Common Issue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {corrections.map((correction, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium">{correction.field}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{correction.count}</Badge>
                </TableCell>
                <TableCell>{correction.percentage.toFixed(1)}%</TableCell>
                <TableCell className="text-sm text-muted-foreground">{correction.commonIssue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
