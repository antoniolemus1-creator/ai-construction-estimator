import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChangeOrderDashboard } from '@/components/ChangeOrderDashboard';
import { ChangeOrderList } from '@/components/ChangeOrderList';
import { ChangeOrderDetails } from '@/components/ChangeOrderDetails';
import { CreateChangeOrderModal } from '@/components/CreateChangeOrderModal';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus, ArrowLeft } from 'lucide-react';

export default function ChangeOrdersPage() {
  const { toast } = useToast();
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [selectedChangeOrderId, setSelectedChangeOrderId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChangeOrders();
  }, []);

  const loadChangeOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('change_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChangeOrders(data || []);
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

  const stats = {
    totalChangeOrders: changeOrders.length,
    pendingApprovals: changeOrders.filter(co => co.status === 'pending_approval').length,
    approvedCount: changeOrders.filter(co => co.status === 'approved').length,
    totalCostImpact: changeOrders.reduce((sum, co) => sum + (co.change_cost || 0), 0),
    cumulativeCost: changeOrders.reduce((sum, co) => sum + (co.new_total_cost || 0), 0),
  };

  if (selectedChangeOrderId) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSelectedChangeOrderId(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <ChangeOrderDetails
          changeOrderId={selectedChangeOrderId}
          onClose={() => setSelectedChangeOrderId(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Change Order Management</h1>
          <p className="text-muted-foreground">Track plan revisions and cost impacts</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Change Order
        </Button>
      </div>

      <ChangeOrderDashboard stats={stats} />

      {loading ? (
        <div className="text-center py-8">Loading change orders...</div>
      ) : (
        <ChangeOrderList
          changeOrders={changeOrders}
          onSelectChangeOrder={setSelectedChangeOrderId}
        />
      )}

      <CreateChangeOrderModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={loadChangeOrders}
      />
    </div>
  );
}
