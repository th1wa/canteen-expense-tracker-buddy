
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSummaryData } from "@/hooks/useSummaryData";
import { useExportData } from "@/hooks/useExportData";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

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
      <div className="text-center py-8 sm:py-12 container-mobile">
        <div className="max-w-md mx-auto">
          <h2 className="text-responsive-lg font-semibold text-destructive mb-4">Loading...</h2>
          <p className="text-responsive-sm text-muted-foreground">Please wait while we load your profile.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-8 sm:py-12 container-mobile">
        <div className="max-w-md mx-auto">
          <h2 className="text-responsive-lg font-semibold text-destructive mb-4">Access Denied</h2>
          <p className="text-responsive-sm text-muted-foreground">Only HR and Admin users can access summary reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8 sm:py-12 container-mobile">
        <div className="text-responsive-sm">Loading summary data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 container-mobile">
      {/* Header Section */}
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
