import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Star, Award, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function ModelMarketplace() {
  const [models, setModels] = useState<any[]>([]);
  const [filteredModels, setFilteredModels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [userPoints, setUserPoints] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadModels();
    loadUserPoints();
  }, []);

  useEffect(() => {
    filterModels();
  }, [searchTerm, filterType, models]);

  const loadModels = async () => {
    const { data } = await supabase
      .from('model_marketplace')
      .select('*, user_profiles(full_name)')
      .eq('is_public', true)
      .order('download_count', { ascending: false });

    setModels(data || []);
  };

  const loadUserPoints = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_contribution_stats')
      .select('total_reward_points')
      .eq('user_id', user.id)
      .single();

    setUserPoints(data?.total_reward_points || 0);
  };

  const filterModels = () => {
    let filtered = models;

    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.construction_type === filterType);
    }

    if (searchTerm) {
      filtered = filtered.filter(m =>
        m.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredModels(filtered);
  };

  const handlePurchase = async (model: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'Please sign in to purchase models', variant: 'destructive' });
      return;
    }

    if (userPoints < model.price_points) {
      toast({ title: 'Insufficient Points', description: 'You need more reward points', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('model_purchases').insert({
      user_id: user.id,
      model_id: model.id,
      points_spent: model.price_points
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await supabase.from('model_marketplace')
        .update({ download_count: model.download_count + 1 })
        .eq('id', model.id);

      await supabase.from('user_contribution_stats')
        .update({ total_reward_points: userPoints - model.price_points })
        .eq('user_id', user.id);

      toast({ title: 'Success', description: 'Model purchased successfully!' });
      loadModels();
      loadUserPoints();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Model Marketplace</h2>
          <p className="text-muted-foreground">Custom-trained models for specific construction types</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-lg">
          <Award className="h-5 w-5 text-amber-600" />
          <span className="font-bold">{userPoints} Points</span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <Card key={model.id}>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span>{model.model_name}</span>
                <Badge>{model.construction_type}</Badge>
              </CardTitle>
              <CardDescription>{model.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  {model.accuracy_rating?.toFixed(1)}% accuracy
                </span>
                <span className="text-muted-foreground">
                  <Download className="h-4 w-4 inline" /> {model.download_count}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {model.training_samples} training samples
              </div>
              <Button
                onClick={() => handlePurchase(model)}
                className="w-full"
                disabled={userPoints < model.price_points}
              >
                Purchase for {model.price_points} Points
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}