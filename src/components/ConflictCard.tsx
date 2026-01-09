import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useState } from 'react';

interface ConflictCardProps {
  conflict: any;
  onResolve: (id: string, notes: string) => void;
  onDismiss: (id: string, notes: string) => void;
}

export function ConflictCard({ conflict, onResolve, onDismiss }: ConflictCardProps) {
  const [notes, setNotes] = useState('');
  const [showActions, setShowActions] = useState(false);

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const statusIcons = {
    open: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    in_review: <Clock className="h-4 w-4 text-blue-500" />,
    resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
    dismissed: <XCircle className="h-4 w-4 text-gray-500" />
  };

  return (
    <Card className={`p-4 border-l-4 ${severityColors[conflict.severity]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {statusIcons[conflict.status]}
          <h3 className="font-semibold">{conflict.item_name}</h3>
        </div>
        <Badge variant="outline">{conflict.severity}</Badge>
      </div>

      <p className="text-sm text-gray-700 mb-3">{conflict.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="font-medium">Specification:</span>
          <p className="text-gray-600">{conflict.spec_value}</p>
          <p className="text-xs text-gray-500">{conflict.spec_location}</p>
        </div>
        <div>
          <span className="font-medium">Drawing:</span>
          <p className="text-gray-600">{conflict.drawing_value}</p>
          <p className="text-xs text-gray-500">{conflict.drawing_location}</p>
        </div>
      </div>

      {conflict.suggested_resolution && (
        <div className="bg-blue-50 p-2 rounded text-sm mb-3">
          <span className="font-medium">Suggested Resolution:</span>
          <p className="text-gray-700">{conflict.suggested_resolution}</p>
        </div>
      )}

      {conflict.status === 'open' && (
        <div className="space-y-2">
          {showActions ? (
            <>
              <Textarea
                placeholder="Add resolution notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onResolve(conflict.id, notes)}>
                  Mark Resolved
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDismiss(conflict.id, notes)}>
                  Dismiss
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowActions(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowActions(true)}>
              Take Action
            </Button>
          )}
        </div>
      )}

      {conflict.resolution_notes && (
        <div className="mt-3 pt-3 border-t text-sm">
          <span className="font-medium">Resolution Notes:</span>
          <p className="text-gray-600">{conflict.resolution_notes}</p>
        </div>
      )}
    </Card>
  );
}