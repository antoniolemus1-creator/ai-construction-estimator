import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Globe, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LicenseDomainManagerProps {
  licenseId: string;
  licenseKey: string;
  domains: string[];
  onUpdate: () => void;
}

export function LicenseDomainManager({ licenseId, licenseKey, domains, onUpdate }: LicenseDomainManagerProps) {
  const [currentDomains, setCurrentDomains] = useState<string[]>(domains);
  const [newDomain, setNewDomain] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    
    const updatedDomains = [...currentDomains, newDomain.trim()];
    const { error } = await supabase
      .from('license_keys')
      .update({ allowed_domains: updatedDomains })
      .eq('id', licenseId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to add domain', variant: 'destructive' });
    } else {
      setCurrentDomains(updatedDomains);
      setNewDomain('');
      toast({ title: 'Success', description: 'Domain added' });
      onUpdate();
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    const updatedDomains = currentDomains.filter(d => d !== domain);
    const { error } = await supabase
      .from('license_keys')
      .update({ allowed_domains: updatedDomains })
      .eq('id', licenseId);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove domain', variant: 'destructive' });
    } else {
      setCurrentDomains(updatedDomains);
      toast({ title: 'Success', description: 'Domain removed' });
      onUpdate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Globe className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0f1419] border-cyan-400">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Domains</DialogTitle>
          <p className="text-sm text-gray-400 font-mono">{licenseKey}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add new domain..."
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
              className="bg-black/30 text-white"
            />
            <Button onClick={handleAddDomain} className="bg-cyan-500 hover:bg-cyan-600">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-cyan-300">Current Domains ({currentDomains.length})</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {currentDomains.map((domain, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/30 p-2 rounded">
                  <span className="text-white">{domain}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveDomain(domain)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
