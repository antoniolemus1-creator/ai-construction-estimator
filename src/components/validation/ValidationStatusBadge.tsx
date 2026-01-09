import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

interface ValidationStatusBadgeProps {
  status: 'verified' | 'needs_correction' | 'incorrect' | 'pending';
}

export function ValidationStatusBadge({ status }: ValidationStatusBadgeProps) {
  const config = {
    verified: { icon: CheckCircle, label: 'Verified', variant: 'default' as const, className: 'bg-green-500' },
    needs_correction: { icon: AlertCircle, label: 'Needs Correction', variant: 'secondary' as const, className: 'bg-yellow-500' },
    incorrect: { icon: XCircle, label: 'Incorrect', variant: 'destructive' as const, className: 'bg-red-500' },
    pending: { icon: Clock, label: 'Pending', variant: 'outline' as const, className: '' },
  };

  const { icon: Icon, label, variant, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
