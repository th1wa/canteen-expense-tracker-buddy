
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useSummaryData } from "@/hooks/useSummaryData";
import { useExportData } from "@/hooks/useExportData";
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

  // Check if user has admin or hr role
  const hasAccess = profile && (profile.role === 'admin' || profile.role === 'hr');

  // Custom hooks
  const { summaryData, loading } = useSummaryData(selectedMonth, hasAccess);
  const { isExporting, handleExportSummary, handleExportUserDetail } = useExportData();

  useEffect(() => {
    const filtered = summaryData.filter(user =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, summaryData]);

  const handleToggleExpand = (userName: string) => {
    setExpandedUser(expandedUser === userName ? null : userName);
  };

  const onExportSummary = () => {
    if (!hasAccess) return;
    handleExportSummary(selectedMonth);
  };

  const onExportUserDetail = (userName: string) => {
    if (!hasAccess) return;
    handleExportUserDetail(userName, selectedMonth);
  };

  // Calculate totals
  const grandTotals = filteredData.reduce(
    (acc, user) => ({
      totalUsers: acc.totalUsers + 1,
      totalExpenses: acc.totalExpenses + user.total_expenses,
      totalPaid: acc.totalPaid + user.total_paid,
      totalRemaining: acc.totalRemaining + user.total_remainder
    }),
    { totalUsers: 0, totalExpenses: 0, totalPaid: 0, totalRemaining: 0 }
  );

  if (!hasAccess) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Only HR and Admin users can access summary reports.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading summary data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Expense & Payment Summary</h2>
          <p className="text-muted-foreground">Monthly breakdown of user expenses and payments</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
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
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
      </div>

      {/* Export Controls */}
      <ExportControls
        isExporting={isExporting}
        selectedUserForExport={selectedUserForExport}
        setSelectedUserForExport={setSelectedUserForExport}
        filteredData={filteredData}
        onExportSummary={onExportSummary}
        onExportUserDetail={onExportUserDetail}
      />

      {/* Summary Cards */}
      <SummaryCards
        totalUsers={grandTotals.totalUsers}
        totalExpenses={grandTotals.totalExpenses}
        totalPaid={grandTotals.totalPaid}
        totalRemaining={grandTotals.totalRemaining}
      />

      {/* User Summary Table */}
      <UserSummaryTable
        filteredData={filteredData}
        searchTerm={searchTerm}
        expandedUser={expandedUser}
        isExporting={isExporting}
        onToggleExpand={handleToggleExpand}
        onExportUserDetail={onExportUserDetail}
      />
    </div>
  );
};

export default UserExpenseSummary;
