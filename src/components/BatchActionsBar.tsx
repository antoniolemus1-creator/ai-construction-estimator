import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface Props {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onClear: () => void;
}

export default function BatchActionsBar({ selectedCount, onApprove, onReject, onClear }: Props) {
  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium">{selectedCount} items selected</span>
          <Button size="sm" onClick={onApprove}>
            <CheckCircle className="w-4 h-4 mr-1" />
            Approve All
          </Button>
          <Button size="sm" variant="destructive" onClick={onReject}>
            <XCircle className="w-4 h-4 mr-1" />
            Reject All
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
}