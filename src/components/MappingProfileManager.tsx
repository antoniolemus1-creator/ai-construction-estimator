import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MappingProfile {
  name: string;
  mappings: Record<string, string>;
}

interface MappingProfileManagerProps {
  currentMappings: Record<string, string>;
  onLoadProfile: (mappings: Record<string, string>) => void;
}

export function MappingProfileManager({ currentMappings, onLoadProfile }: MappingProfileManagerProps) {
  const [profileName, setProfileName] = useState('');
  const [profiles, setProfiles] = useState<MappingProfile[]>(() => {
    const saved = localStorage.getItem('csv_mapping_profiles');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  const saveProfile = () => {
    if (!profileName.trim()) {
      toast({ title: 'Error', description: 'Please enter a profile name', variant: 'destructive' });
      return;
    }
    const newProfile = { name: profileName, mappings: currentMappings };
    const updated = [...profiles.filter(p => p.name !== profileName), newProfile];
    setProfiles(updated);
    localStorage.setItem('csv_mapping_profiles', JSON.stringify(updated));
    toast({ title: 'Success', description: `Profile "${profileName}" saved` });
    setProfileName('');
  };

  const deleteProfile = (name: string) => {
    const updated = profiles.filter(p => p.name !== name);
    setProfiles(updated);
    localStorage.setItem('csv_mapping_profiles', JSON.stringify(updated));
    toast({ title: 'Success', description: 'Profile deleted' });
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="font-semibold">Mapping Profiles</h3>
      <div className="flex gap-2">
        <Input
          placeholder="Profile name..."
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
        />
        <Button onClick={saveProfile}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
      {profiles.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Load Saved Profile:</label>
          {profiles.map((profile) => (
            <div key={profile.name} className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start"
                onClick={() => onLoadProfile(profile.mappings)}
              >
                {profile.name}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteProfile(profile.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
