import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';

interface ChangeOrderStats {
  totalChangeOrders: number;
  pendingApprovals: number;
  approvedCount: number;
  totalCostImpact: number;
  cumulativeCost: number;
}

interface ChangeOrderDashboardProps {
  stats: ChangeOrderStats;
}

export function ChangeOrderDashboard({ stats }: ChangeOrderDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const isPositive = stats.totalCostImpact >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Change Orders</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalChangeOrders}</div>
          <p className="text-xs text-muted-foreground">Active change orders</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          <p className="text-xs text-muted-foreground">Awaiting review</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approved</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.approvedCount}</div>
          <p className="text-xs text-muted-foreground">Completed approvals</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost Impact</CardTitle>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.abs(stats.totalCostImpact))}
          </div>
          <p className="text-xs text-muted-foreground">
            {isPositive ? 'Cost increase' : 'Cost savings'}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cumulative Project Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.cumulativeCost)}</div>
          <p className="text-xs text-muted-foreground">Total project cost with changes</p>
        </CardContent>
      </Card>
    </div>
  );
}
