import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { FileSpreadsheet, Download, Loader2, ChevronDown } from 'lucide-react';
import { exportToQuickBid, exportWallSummaryToQuickBid } from '@/lib/quickbidExport';

interface QuickBidExportProps {
  planId: string;
  planName: string;
  disabled?: boolean;
}

export function QuickBidExport({ planId, planName, disabled }: QuickBidExportProps) {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExportFull = async () => {
    setExporting(true);
    try {
      await exportToQuickBid(planId, planName);
      toast({
        title: 'Export Complete',
        description: 'QuickBid-compatible Excel file has been downloaded.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast({
        title: 'Export Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportWallsOnly = async () => {
    setExporting(true);
    try {
      await exportWallSummaryToQuickBid(planId, planName);
      toast({
        title: 'Export Complete',
        description: 'Wall summary Excel file has been downloaded.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      toast({
        title: 'Export Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || exporting}
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          Export to QuickBid
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>QuickBid Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportFull}>
          <Download className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Full Takeoff Export</span>
            <span className="text-xs text-muted-foreground">
              All conditions, walls, doors, windows
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportWallsOnly}>
          <Download className="h-4 w-4 mr-2" />
          <div className="flex flex-col">
            <span>Wall Summary Only</span>
            <span className="text-xs text-muted-foreground">
              Simplified wall type totals
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Exports Excel file compatible with On-Center QuickBid quantity survey import
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default QuickBidExport;
