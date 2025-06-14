
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { SummaryHeaderProps } from '@/types/summary';

const SummaryHeader: React.FC<SummaryHeaderProps> = ({
  selectedMonth,
  setSelectedMonth,
  searchTerm,
  setSearchTerm
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
    </div>
  );
};

export default SummaryHeader;
