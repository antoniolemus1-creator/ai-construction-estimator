import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Filter } from 'lucide-react';

interface ChangeOrder {
  id: string;
  change_order_number: string;
  title: string;
  status: string;
  change_cost: number;
  priority: string;
  created_at: string;
  due_date?: string;
}

interface ChangeOrderListProps {
  changeOrders: ChangeOrder[];
  onSelectChangeOrder: (id: string) => void;
}

export function ChangeOrderList({ changeOrders, onSelectChangeOrder }: ChangeOrderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending_approval': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'implemented': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const filteredOrders = changeOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.change_order_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Change Orders
        </CardTitle>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search change orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_approval">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="implemented">Implemented</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onSelectChangeOrder(order.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{order.change_order_number}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                    <span className={`text-xs font-medium ${getPriorityColor(order.priority)}`}>
                      {order.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.title}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
                    {order.due_date && <span>Due: {new Date(order.due_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${order.change_cost >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {order.change_cost >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(order.change_cost)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No change orders found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
