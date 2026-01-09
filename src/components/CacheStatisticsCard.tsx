import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Database, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CacheStats {
  total_cache_hits: number;
  total_tokens_saved: number;
  total_cost_saved: number;
}

export default function CacheStatisticsCard() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('cache_statistics')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (data) setStats(data);
    } catch (err) {
      console.error('Error loading cache stats:', err);
    }
  };

  if (!stats || stats.total_cache_hits === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Database className="w-5 h-5" />
          Cache Savings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
              <Zap className="w-5 h-5" />
              {stats.total_cache_hits}
            </div>
            <div className="text-xs text-gray-600">Cache Hits</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-blue-600">
              <TrendingUp className="w-5 h-5" />
              {stats.total_tokens_saved.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Tokens Saved</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-600">
              <DollarSign className="w-5 h-5" />
              {stats.total_cost_saved.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">Cost Saved</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
