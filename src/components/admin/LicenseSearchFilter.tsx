import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface LicenseSearchFilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  expiryFilter: string;
  setExpiryFilter: (expiry: string) => void;
}

export function LicenseSearchFilter({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  expiryFilter,
  setExpiryFilter
}: LicenseSearchFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-4 h-4" />
        <Input
          placeholder="Search by company, email, or license key..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-black/30 text-white border-cyan-400/30"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="bg-black/30 text-white border-cyan-400/30">
          <Filter className="w-4 h-4 mr-2 text-cyan-400" />
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent className="bg-[#0f1419] border-cyan-400">
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      <Select value={expiryFilter} onValueChange={setExpiryFilter}>
        <SelectTrigger className="bg-black/30 text-white border-cyan-400/30">
          <SelectValue placeholder="Filter by expiry" />
        </SelectTrigger>
        <SelectContent className="bg-[#0f1419] border-cyan-400">
          <SelectItem value="all">All Licenses</SelectItem>
          <SelectItem value="expiring_soon">Expiring Soon (30 days)</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="valid">Valid</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
