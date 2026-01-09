import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface LaborRate {
  id: string;
  trade_name: string;
  trade_category: string;
  skill_level: string;
  naics_code: string;
  base_hourly_rate: number;
  state_code: string;
  metro_area: string;
  union_rate: boolean;
  is_active: boolean;
}

export function LaborRatesManager() {
  const [rates, setRates] = useState<LaborRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      const { data, error } = await supabase
        .from('construction_labor_rates')
        .select('*')
        .order('trade_name');

      if (error) throw error;
      setRates(data || []);
    } catch (error: any) {
      toast.error('Failed to load labor rates: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRates = rates.filter(r => {
    const matchesSearch = r.trade_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || r.state_code === stateFilter;
    return matchesSearch && matchesState;
  });

  const states = ['all', 'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Labor Rates Database</span>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Labor Rate
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {states.map(state => (
              <option key={state} value={state}>
                {state === 'all' ? 'All States' : state}
              </option>
            ))}
          </select>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Skill Level</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Metro Area</TableHead>
                <TableHead>Hourly Rate</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.trade_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{rate.trade_category}</Badge>
                  </TableCell>
                  <TableCell>{rate.skill_level}</TableCell>
                  <TableCell>{rate.state_code}</TableCell>
                  <TableCell className="text-sm">{rate.metro_area}</TableCell>
                  <TableCell className="font-semibold">${rate.base_hourly_rate}/hr</TableCell>
                  <TableCell>
                    <Badge variant={rate.union_rate ? 'default' : 'secondary'}>
                      {rate.union_rate ? 'Union' : 'Non-Union'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
