import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivationRequest {
  id: string;
  license_key: string;
  domain: string;
  email: string;
  verified: boolean;
  verification_token: string;
  created_at: string;
  expires_at: string;
}

export function LicenseActivationRequests() {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('license_activation_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setRequests(data);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('license_activation_requests')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to approve request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Activation approved' });
      loadRequests();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('license_activation_requests')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to reject request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Request rejected' });
      loadRequests();
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-2 border-cyan-400">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-cyan-400" />
            Activation Requests
          </CardTitle>
          <Button onClick={loadRequests} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-400">No pending requests</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-cyan-300">License Key</TableHead>
                <TableHead className="text-cyan-300">Domain</TableHead>
                <TableHead className="text-cyan-300">Email</TableHead>
                <TableHead className="text-cyan-300">Status</TableHead>
                <TableHead className="text-cyan-300">Date</TableHead>
                <TableHead className="text-cyan-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="text-white font-mono text-sm">{req.license_key}</TableCell>
                  <TableCell className="text-white">{req.domain}</TableCell>
                  <TableCell className="text-white">{req.email}</TableCell>
                  <TableCell>
                    <Badge variant={req.verified ? 'default' : 'secondary'}>
                      {req.verified ? 'Verified' : 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {!req.verified && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApprove(req.id)} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleReject(req.id)} variant="destructive">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
