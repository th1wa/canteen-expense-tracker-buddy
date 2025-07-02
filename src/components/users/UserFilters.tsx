
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, FilterX, TrendingUp, Users, CheckCircle } from "lucide-react";

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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value || '');
  };

  const handleBalanceFilterChange = (value: string) => {
    setBalanceFilter(value === 'all' ? '' : value);
  };

  const handleSettlementFilterChange = (value: string) => {
    setSettlementFilter(value === 'all' ? '' : value);
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 border-2 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Activity Filters
                </h3>
                <p className="text-sm text-muted-foreground">Filter and search user data</p>
              </div>
            </div>
            
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="h-10 px-4 border-2 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-all duration-300 hover:scale-105 group"
              >
                <FilterX className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Clear All
              </Button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search Filter */}
            <div className="space-y-3 group">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Search className="w-4 h-4" />
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <Input
                  placeholder="Search username..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="h-12 pl-10 bg-white dark:bg-gray-900 border-2 hover:border-blue-300 focus:border-blue-500 transition-all duration-300 text-base font-medium group-hover:shadow-md"
                />
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>

            {/* Balance Filter */}
            <div className="space-y-3 group">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <TrendingUp className="w-4 h-4" />
                Balance Range
              </label>
              <div className="relative">
                <Select 
                  value={balanceFilter || 'all'} 
                  onValueChange={handleBalanceFilterChange}
                >
                  <SelectTrigger className="h-12 bg-white dark:bg-gray-900 border-2 hover:border-green-300 focus:border-green-500 transition-all duration-300 text-base font-medium group-hover:shadow-md">
                    <SelectValue placeholder="All balances" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-2 shadow-xl">
                    <SelectItem value="all" className="py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        All balances
                      </div>
                    </SelectItem>
                    <SelectItem value="positive" className="py-3 hover:bg-green-50 dark:hover:bg-green-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Has balance
                      </div>
                    </SelectItem>
                    <SelectItem value="zero" className="py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Zero balance
                      </div>
                    </SelectItem>
                    <SelectItem value="low" className="py-3 hover:bg-yellow-50 dark:hover:bg-yellow-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        Rs. 1-500
                      </div>
                    </SelectItem>
                    <SelectItem value="medium" className="py-3 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        Rs. 501-2000
                      </div>
                    </SelectItem>
                    <SelectItem value="high" className="py-3 hover:bg-purple-50 dark:hover:bg-purple-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        Rs. 2001+
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>

            {/* Settlement Filter */}
            <div className="space-y-3 group">
              <label className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <CheckCircle className="w-4 h-4" />
                Settlement Status
              </label>
              <div className="relative">
                <Select 
                  value={settlementFilter || 'all'} 
                  onValueChange={handleSettlementFilterChange}
                >
                  <SelectTrigger className="h-12 bg-white dark:bg-gray-900 border-2 hover:border-purple-300 focus:border-purple-500 transition-all duration-300 text-base font-medium group-hover:shadow-md">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-2 shadow-xl">
                    <SelectItem value="all" className="py-3 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        All statuses
                      </div>
                    </SelectItem>
                    <SelectItem value="settled" className="py-3 hover:bg-green-50 dark:hover:bg-green-950/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Fully settled
                      </div>
                    </SelectItem>
                    <SelectItem value="pending" className="py-3 hover:bg-orange-50 dark:hover:bg-orange-950/20">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        Has pending balance
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filters Indicator */}
          {hasActiveFilters && (
            <div className="flex items-center justify-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800 animate-fade-in">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Active filters applied
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserFilters;
