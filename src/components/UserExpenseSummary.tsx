
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSummaryData } from "@/hooks/useSummaryData";
import { useExportData } from "@/hooks/useExportData";
import { useToast } from "@/hooks/use-toast";
import ExportControls from "./ExportControls";
import SummaryCards from "./SummaryCards";
import UserSummaryTable from "./UserSummaryTable";

interface UserSummary {
  user_name: string;
  total_expenses: number;
  total_paid: number;
  total_remainder: number;
  daily_records: any[];
}

const UserExpenseSummary = () => {
  const [filteredData, setFilteredData] = useState<UserSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedUserForExport, setSelectedUserForExport] = useState<string>('');
  const { profile } = useAuth();
  const { toast } = useToast();

  // Check if user has admin or hr role with proper null checking
  const hasAccess = profile?.role === 'admin' || profile?.role === 'hr';

  // Custom hooks
  const { summaryData, loading, error } = useSummaryData(selectedMonth, hasAccess);
  const { isExporting, handleExportSummary, handleExportUserDetail } = useExportData();

  useEffect(() => {
    if (!summaryData) return;
    
    const filtered = summaryData.filter(user =>
      user?.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, summaryData]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load summary data. Please try again.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handleToggleExpand = (userName: string) => {
    if (!userName) return;
    setExpandedUser(expandedUser === userName ? null : userName);
  };

  const onExportSummary = async () => {
    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to export data.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await handleExportSummary(selectedMonth);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export summary. Please try again.",
        variant: "destructive"
      });
    }
  };

  const onExportUserDetail = async (userName: string) => {
    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to export data.",
        variant: "destructive"
      });
      return;
    }
    
    if (!userName?.trim()) {
      toast({
        title: "Invalid Selection",
        description: "Please select a valid user to export.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await handleExportUserDetail(userName, selectedMonth);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export user data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate totals with proper null checking
  const grandTotals = filteredData.reduce(
    (acc, user) => {
      if (!user) return acc;
      
      return {
        totalUsers: acc.totalUsers + 1,
        totalExpenses: acc.totalExpenses + (Number(user.total_expenses) || 0),
        totalPaid: acc.totalPaid + (Number(user.total_paid) || 0),
        totalRemaining: acc.totalRemaining + (Number(user.total_remainder) || 0)
      };
    },
    { totalUsers: 0, totalExpenses: 0, totalPaid: 0, totalRemaining: 0 }
  );

  if (!profile) {
    return (
      <div className="text-center py-6 sm:py-8 md:py-12 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-destructive mb-3 sm:mb-4">Loading...</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-6 sm:py-8 md:py-12 px-4">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-destructive mb-3 sm:mb-4">Access Denied</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Only HR and Admin users can access summary reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-6 sm:py-8 md:py-12 px-4">
        <div className="text-sm sm:text-base">Loading summary data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-4 md:px-0">
      {/* Header Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">
            User Expense & Payment Summary
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Monthly breakdown of user expenses and payments
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
                className="w-full sm:w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <div className="w-full">
        <ExportControls
          isExporting={isExporting}
          selectedUserForExport={selectedUserForExport}
          setSelectedUserForExport={setSelectedUserForExport}
          filteredData={filteredData}
          onExportSummary={onExportSummary}
          onExportUserDetail={onExportUserDetail}
        />
      </div>

      {/* Summary Cards */}
      <div className="w-full">
        <SummaryCards
          totalUsers={grandTotals.totalUsers}
          totalExpenses={grandTotals.totalExpenses}
          totalPaid={grandTotals.totalPaid}
          totalRemaining={grandTotals.totalRemaining}
        />
      </div>

      {/* User Summary Table */}
      <div className="w-full">
        <UserSummaryTable
          filteredData={filteredData}
          searchTerm={searchTerm}
          expandedUser={expandedUser}
          isExporting={isExporting}
          onToggleExpand={handleToggleExpand}
          onExportUserDetail={onExportUserDetail}
        />
      </div>
    </div>
  );
};

export default UserExpenseSummary;
