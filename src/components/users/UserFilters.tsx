
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, FilterX } from "lucide-react";

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  balanceFilter: string;
  setBalanceFilter: (filter: string) => void;
  settlementFilter: string;
  setSettlementFilter: (filter: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

const UserFilters = ({
  searchTerm,
  setSearchTerm,
  balanceFilter,
  setBalanceFilter,
  settlementFilter,
  setSettlementFilter,
  hasActiveFilters,
  onClearFilters
}: UserFiltersProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="text-xs"
          >
            <FilterX className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Filter */}
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value || '')}
            className="text-xs"
          />
        </div>

        {/* Balance Filter */}
        <Select value={balanceFilter} onValueChange={setBalanceFilter}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="All balances" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All balances</SelectItem>
            <SelectItem value="positive">Has balance</SelectItem>
            <SelectItem value="zero">Zero balance</SelectItem>
            <SelectItem value="low">Rs. 1-500</SelectItem>
            <SelectItem value="medium">Rs. 501-2000</SelectItem>
            <SelectItem value="high">Rs. 2001+</SelectItem>
          </SelectContent>
        </Select>

        {/* Settlement Filter */}
        <Select value={settlementFilter} onValueChange={setSettlementFilter}>
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="settled">Fully settled</SelectItem>
            <SelectItem value="pending">Has pending balance</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default UserFilters;
