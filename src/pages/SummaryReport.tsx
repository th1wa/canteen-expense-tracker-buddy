
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import SummaryHeader from "@/components/summary/SummaryHeader";
import UserSummaryTable from "@/components/UserSummaryTable";
import ExportControls from "@/components/ExportControls";
import SummaryCards from "@/components/SummaryCards";
import { useSummaryData } from "@/hooks/useSummaryData";
import { useSummaryCalculations } from "@/hooks/useSummaryCalculations";
import { useExportData } from "@/hooks/useExportData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const SummaryReport = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  
  // Check if user has access to summary reports
  const hasAccess = profile && ['admin', 'hr', 'canteen'].includes(profile.role);
  
  // State for filters
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForExport, setSelectedUserForExport] = useState('');
  
  // Fetch summary data
  const { summaryData, loading, error } = useSummaryData(selectedMonth, hasAccess);
  
  // Filter data based on search term
  const filteredData = summaryData.filter(user =>
    user.user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate totals
  const { grandTotals } = useSummaryCalculations(filteredData);
  
  // Export functionality
  const { isExporting, handleExportSummary, handleExportUserDetail } = useExportData();
  
  const handleExportSummaryWrapper = () => {
    handleExportSummary(selectedMonth);
  };
  
  const handleExportUserDetailWrapper = (userName: string) => {
    handleExportUserDetail(userName, selectedMonth);
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardContent className="text-center py-12">
              <div className="mb-4">
                <TrendingUp className="w-16 h-16 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have permission to view summary reports. Contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className={`${isMobile ? 'p-3' : 'p-4 sm:p-6'} max-w-7xl mx-auto`}>
        {/* Header */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7" />
                Summary Report
              </CardTitle>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-blue-100`}>
                Comprehensive overview of expenses and payments
              </p>
            </CardHeader>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="mb-6">
          <SummaryHeader
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        {/* Export Controls */}
        <div className="mb-6">
          <ExportControls
            isExporting={isExporting}
            selectedUserForExport={selectedUserForExport}
            setSelectedUserForExport={setSelectedUserForExport}
            filteredData={filteredData}
            onExportSummary={handleExportSummaryWrapper}
            onExportUserDetail={handleExportUserDetailWrapper}
          />
        </div>

        {/* Summary Cards */}
        <div className="mb-6">
          <SummaryCards
            totalUsers={grandTotals.totalUsers}
            totalExpenses={grandTotals.totalExpenses}
            totalPaid={grandTotals.totalPaid}
            totalRemaining={grandTotals.totalRemaining}
            selectedMonth={selectedMonth}
          />
        </div>

        {/* Data Table */}
        <Card className="bg-white dark:bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'}`}>
              User Summary Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">Loading summary data...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600 dark:text-red-400">
                <p className="font-medium">Error loading data</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No data found for the selected criteria</p>
              </div>
            ) : (
              <UserSummaryTable
                filteredData={filteredData}
                searchTerm={searchTerm}
                expandedUser={null}
                isExporting={isExporting}
                onToggleExpand={() => {}}
                onExportUserDetail={handleExportUserDetailWrapper}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryReport;
