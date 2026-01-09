import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Building2, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const OrganizationSwitcher: React.FC = () => {
  const { activeOrganization, organizations, setActiveOrganization } = useAppContext();

  if (organizations.length === 0) {
    return null; // Don't show if user has no organizations
  }

  const currentValue = activeOrganization || 'personal';
  const currentLabel = activeOrganization 
    ? organizations.find(o => o.id === activeOrganization)?.name || 'Personal'
    : 'Personal';

  return (
    <Select value={currentValue} onValueChange={(value) => {
      setActiveOrganization(value === 'personal' ? null : value);
    }}>
      <SelectTrigger className="w-[200px] bg-[#0f1219] border-gray-700 text-white">
        <div className="flex items-center gap-2">
          {currentValue === 'personal' ? (
            <User className="w-4 h-4 text-cyan-500" />
          ) : (
            <Building2 className="w-4 h-4 text-cyan-500" />
          )}
          <SelectValue>{currentLabel}</SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-[#0f1219] border-gray-700">
        <SelectItem value="personal" className="text-white hover:bg-gray-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-cyan-500" />
            <span>Personal</span>
          </div>
        </SelectItem>
        {organizations.map(org => (
          <SelectItem key={org.id} value={org.id} className="text-white hover:bg-gray-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-500" />
              <span>{org.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
