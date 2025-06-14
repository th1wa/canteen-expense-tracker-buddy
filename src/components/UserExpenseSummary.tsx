
import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSummaryData } from "@/hooks/useSummaryData";
import { useExportData } from "@/hooks/useExportData";
import { useToast } from "@/hooks/use-toast";
import { useSummaryCalculations } from "@/hooks/useSummaryCalculations";
import { UserSummary } from '@/types/summary';
import SummaryHeader from "./summary/SummaryHeader";
import ExportControls from "./ExportControls";
import SummaryCards from "./SummaryCards";
import UserSummaryTable from "./UserSummaryTable";

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
  const { grandTotals } = useSummaryCalculations(filteredData);

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
      <SummaryHeader
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

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

      <div className="w-full">
        <SummaryCards
          totalUsers={grandTotals.totalUsers}
          totalExpenses={grandTotals.totalExpenses}
          totalPaid={grandTotals.totalPaid}
          totalRemaining={grandTotals.totalRemaining}
        />
      </div>

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
