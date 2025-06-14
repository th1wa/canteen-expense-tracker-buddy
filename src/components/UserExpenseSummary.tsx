import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, DollarSign, Users, TrendingUp, Download, FileSpreadsheet, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ExpenseSummary {
  user_name: string;
  expense_date: string;
  expense_amount: number;
  payment_made: boolean;
  payment_date: string | null;
  remainder_amount: number;
}

interface UserSummary {
  user_name: string;
  total_expenses: number;
  total_paid: number;
  total_remainder: number;
  daily_records: ExpenseSummary[];
}

const UserExpenseSummary = () => {
  const [summaryData, setSummaryData] = useState<UserSummary[]>([]);
  const [filteredData, setFilteredData] = useState<UserSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedUserForExport, setSelectedUserForExport] = useState<string>('');

  // Check if user has admin or hr role
  const hasAccess = profile && (profile.role === 'admin' || profile.role === 'hr');

  const fetchSummaryData = async () => {
    if (!hasAccess) return;
    
    setLoading(true);
    try {
      const monthDate = new Date(selectedMonth + '-01');
      
      const { data, error } = await supabase.rpc('get_user_expense_summary', {
        selected_month: monthDate.toISOString().split('T')[0]
      });

      if (error) throw error;

      // Group data by user
      const userMap = new Map<string, UserSummary>();
      
      data?.forEach((record: ExpenseSummary) => {
        if (!userMap.has(record.user_name)) {
          userMap.set(record.user_name, {
            user_name: record.user_name,
            total_expenses: 0,
            total_paid: 0,
            total_remainder: 0,
            daily_records: []
          });
        }
        
        const userSummary = userMap.get(record.user_name)!;
        userSummary.daily_records.push(record);
        userSummary.total_expenses += parseFloat(record.expense_amount.toString());
        if (record.payment_made) {
          userSummary.total_paid += parseFloat(record.expense_amount.toString());
        }
        userSummary.total_remainder += parseFloat(record.remainder_amount.toString());
      });

      const summaryArray = Array.from(userMap.values());
      setSummaryData(summaryArray);
      setFilteredData(summaryArray);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch summary data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [selectedMonth, hasAccess]);

  useEffect(() => {
    const filtered = summaryData.filter(user =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, summaryData]);

  const handleExportSummary = async () => {
    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "Only HR and Admin users can export reports.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Invoking excel-export function with:', {
        type: 'summary',
        selectedMonth: selectedMonth
      });

      const response = await fetch(`https://wshugmfkkbpwpxfakqgk.supabase.co/functions/v1/excel-export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'summary',
          selectedMonth: selectedMonth
        })
      });

      console.log('Excel export response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Function error response:', errorText);
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      const csvContent = await response.text();
      console.log('CSV content received, length:', csvContent.length);

      if (!csvContent || csvContent.trim() === '') {
        throw new Error('No data received from export function');
      }

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canteen_summary_report_${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Summary report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to generate summary report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportUserDetail = async (userName: string) => {
    if (!hasAccess || !userName) {
      toast({
        title: "Access Denied",
        description: "Only HR and Admin users can export reports.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`https://wshugmfkkbpwpxfakqgk.supabase.co/functions/v1/excel-export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'user-detail',
          userName: userName,
          selectedMonth: selectedMonth
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      const csvContent = await response.text();

      if (!csvContent || csvContent.trim() === '') {
        throw new Error('No data received from export function');
      }

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `canteen_user_report_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Detailed report for ${userName} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : `Failed to generate report for ${userName}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <Button
                onClick={handleExportSummary}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export Full Summary Report'}
              </Button>
              <p className="text-sm text-muted-foreground mt-1">Download complete summary of all users</p>
            </div>
            
            <div className="flex-1">
              <div className="flex gap-2">
                <Select value={selectedUserForExport} onValueChange={setSelectedUserForExport}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select user for detailed report" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredData.map((user) => (
                      <SelectItem key={user.user_name} value={user.user_name}>
                        {user.user_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleExportUserDetail(selectedUserForExport)}
                  disabled={isExporting || !selectedUserForExport}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Export User Report
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Download detailed report for specific user</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{grandTotals.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">Rs. {grandTotals.totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">Rs. {grandTotals.totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Remaining</p>
                <p className="text-2xl font-bold">Rs. {grandTotals.totalRemaining.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No users found matching your search.' : 'No data found for this month.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((user) => (
                <Card key={user.user_name} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{user.user_name}</h3>
                        <Badge variant={user.total_remainder > 0 ? "destructive" : "default"}>
                          Balance: Rs. {user.total_remainder.toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportUserDetail(user.user_name)}
                          disabled={isExporting}
                          className="flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Export
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedUser(expandedUser === user.user_name ? null : user.user_name)}
                        >
                          {expandedUser === user.user_name ? 'Hide Details' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-lg font-semibold">Rs. {user.total_expenses.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-lg font-semibold text-green-600">Rs. {user.total_paid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className={`text-lg font-semibold ${user.total_remainder > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Rs. {user.total_remainder.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {expandedUser === user.user_name && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Daily Breakdown</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Expense Amount</th>
                                <th className="text-left p-2">Payment Made</th>
                                <th className="text-left p-2">Payment Date</th>
                                <th className="text-left p-2">Remainder</th>
                              </tr>
                            </thead>
                            <tbody>
                              {user.daily_records.map((record, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2">{format(new Date(record.expense_date), 'dd/MM/yyyy')}</td>
                                  <td className="p-2">Rs. {parseFloat(record.expense_amount.toString()).toFixed(2)}</td>
                                  <td className="p-2">
                                    <Badge variant={record.payment_made ? "default" : "secondary"}>
                                      {record.payment_made ? 'Yes' : 'No'}
                                    </Badge>
                                  </td>
                                  <td className="p-2">
                                    {record.payment_date ? format(new Date(record.payment_date), 'dd/MM/yyyy') : '-'}
                                  </td>
                                  <td className="p-2">
                                    <span className={parseFloat(record.remainder_amount.toString()) > 0 ? 'text-red-600' : 'text-green-600'}>
                                      Rs. {parseFloat(record.remainder_amount.toString()).toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserExpenseSummary;
