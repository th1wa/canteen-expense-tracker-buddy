
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Filter, FilterX } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

interface SummaryHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy?: string;
  setSortBy?: (sort: string) => void;
  sortOrder?: string;
  setSortOrder?: (order: string) => void;
  clearFilters?: () => void;
  hasActiveFilters?: boolean;
}

const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  selectedMonth,
  setSelectedMonth,
  searchTerm,
  setSearchTerm,
  sortBy = 'name',
  setSortBy,
  sortOrder = 'asc',
  setSortOrder,
  clearFilters,
  hasActiveFilters = false
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      <div className="text-center sm:text-left">
        <h2 className="text-responsive-xl font-bold text-slate-800 dark:text-slate-200">
          User Expense & Payment Summary
        </h2>
        <p className="text-responsive-sm text-muted-foreground mt-2">
          Monthly breakdown of user expenses and payments
        </p>
      </div>
      
      {/* Controls */}
      <div className={`space-y-3 ${isMobile ? '' : 'sm:space-y-4'}`}>
        {/* Date and Search Controls */}
        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row sm:items-center sm:justify-between'}`}>
          <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'}`}>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className={`${isMobile ? 'w-full' : 'w-full sm:w-40'}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border shadow-lg z-50">
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = format(date, 'yyyy-MM');
                    return (
                      <SelectItem key={value} value={value}>
                        {format(date, 'MMMM yyyy')}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value || '')}
                className={`form-mobile ${isMobile ? 'w-full' : 'w-full sm:w-48'}`}
              />
            </div>
          </div>
        </div>

        {/* Filter and Sort Controls */}
        {(setSortBy || clearFilters) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Sort & Filter</span>
              </div>
              {hasActiveFilters && clearFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs"
                >
                  <FilterX className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {/* Sort By */}
              {setSortBy && (
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">User Name</SelectItem>
                    <SelectItem value="expenses">Total Expenses</SelectItem>
                    <SelectItem value="paid">Total Paid</SelectItem>
                    <SelectItem value="remaining">Remaining Balance</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {/* Sort Order */}
              {setSortOrder && (
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Sort order..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryHeader;
