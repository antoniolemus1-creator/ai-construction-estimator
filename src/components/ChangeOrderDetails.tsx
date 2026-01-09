import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';

interface ChangeOrderDetailsProps {
  changeOrderId: string;
  onClose: () => void;
}

export function ChangeOrderDetails({ changeOrderId, onClose }: ChangeOrderDetailsProps) {
  const { toast } = useToast();
  const [changeOrder, setChangeOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChangeOrderDetails();
  }, [changeOrderId]);

  const loadChangeOrderDetails = async () => {
    try {
      const [coResult, itemsResult, approvalsResult] = await Promise.all([
        supabase.from('change_orders').select('*').eq('id', changeOrderId).single(),
        supabase.from('change_order_items').select('*').eq('change_order_id', changeOrderId),
        supabase.from('change_order_approvals').select('*').eq('change_order_id', changeOrderId),
      ]);

      if (coResult.data) setChangeOrder(coResult.data);
      if (itemsResult.data) setItems(itemsResult.data);
      if (approvalsResult.data) setApprovals(approvalsResult.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-change-order-document', {
        body: { changeOrderId },
      });

      if (error) throw error;

      window.open(data.documentUrl, '_blank');
      toast({
        title: 'Success',
        description: 'Document generated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('change_orders')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', changeOrderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Change order approved',
      });
      loadChangeOrderDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!changeOrder) return <div>Change order not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{changeOrder.change_order_number}</h2>
          <p className="text-muted-foreground">{changeOrder.title}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerateDocument} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Generate Document
          </Button>
          {changeOrder.status === 'pending_approval' && (
            <Button onClick={handleApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{changeOrder.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <Badge variant="outline">{changeOrder.priority}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Change Cost</p>
              <p className="text-lg font-bold">${changeOrder.change_cost?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p>{new Date(changeOrder.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
          <TabsTrigger value="approvals">Approvals ({approvals.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant={item.item_type === 'added' ? 'default' : 'destructive'}>
                          {item.item_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity} {item.unit}</TableCell>
                      <TableCell>${item.unit_cost?.toFixed(2)}</TableCell>
                      <TableCell>${item.total_cost?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="approvals">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{approval.approver_name}</p>
                      <p className="text-sm text-muted-foreground">{approval.approver_role}</p>
                    </div>
                    <Badge>{approval.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
