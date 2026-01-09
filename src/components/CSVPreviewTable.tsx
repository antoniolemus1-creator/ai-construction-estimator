import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CSVPreviewTableProps {
  headers: string[];
  rows: string[][];
}

export function CSVPreviewTable({ headers, rows }: CSVPreviewTableProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-lg">Preview (First 5 Rows)</h3>
      <ScrollArea className="h-[300px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, idx) => (
                <TableHead key={idx} className="whitespace-nowrap">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <TableCell key={cellIdx} className="whitespace-nowrap">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
