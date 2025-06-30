
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileBarChart, 
  Download, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
  DollarSign,
  FileText,
  FileSpreadsheet,
  RefreshCw 
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface ReportData {
  totalExpenses: number;
  totalPayments: number;
  totalUsers: number;
  outstandingAmount: number;
  expensesByUser: { [key: string]: number };
  paymentsByUser: { [key: string]: number };
  dailyExpenses: { date: string; amount: number }[];
  dailyPayments: { date: string; amount: number }[];
  topSpenders: { name: string; amount: number }[];
  recentTransactions: any[];
}

const ReportsAnalytics = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<string>('this-month');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const { toast } = useToast();

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'this-week':
          startDate = subDays(now, 7);
          break;
        case 'this-month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'this-year':
          startDate = startOfYear(now);
          endDate = endOfYear(now);
          break;
        case 'custom':
          if (customDateFrom && customDateTo) {
            startDate = customDateFrom;
            endDate = customDateTo;
          } else {
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
          }
          break;
        default:
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
      }

      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch expenses and payments
      const [expensesResult, paymentsResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', startDateStr)
          .lte('expense_date', endDateStr)
          .order('expense_date', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .gte('payment_date', startDateStr)
          .lte('payment_date', endDateStr)
          .order('payment_date', { ascending: false })
      ]);

      const expenses = expensesResult.data || [];
      const payments = paymentsResult.data || [];

      // Calculate totals
      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
      const totalPayments = payments.reduce((sum, pay) => sum + parseFloat(pay.amount.toString()), 0);
      const outstandingAmount = totalExpenses - totalPayments;

      // Get unique users
      const allUsers = new Set([
        ...expenses.map(e => e.user_name),
        ...payments.map(p => p.user_name)
      ]);
      const totalUsers = allUsers.size;

      // Expenses by user
      const expensesByUser: { [key: string]: number } = {};
      expenses.forEach(exp => {
        expensesByUser[exp.user_name] = (expensesByUser[exp.user_name] || 0) + parseFloat(exp.amount.toString());
      });

      // Payments by user
      const paymentsByUser: { [key: string]: number } = {};
      payments.forEach(pay => {
        paymentsByUser[pay.user_name] = (paymentsByUser[pay.user_name] || 0) + parseFloat(pay.amount.toString());
      });

      // Daily expenses and payments
      const dailyExpenseMap: { [key: string]: number } = {};
      const dailyPaymentMap: { [key: string]: number } = {};

      expenses.forEach(exp => {
        dailyExpenseMap[exp.expense_date] = (dailyExpenseMap[exp.expense_date] || 0) + parseFloat(exp.amount.toString());
      });

      payments.forEach(pay => {
        dailyPaymentMap[pay.payment_date] = (dailyPaymentMap[pay.payment_date] || 0) + parseFloat(pay.amount.toString());
      });

      const dailyExpenses = Object.entries(dailyExpenseMap).map(([date, amount]) => ({ date, amount }));
      const dailyPayments = Object.entries(dailyPaymentMap).map(([date, amount]) => ({ date, amount }));

      // Top spenders
      const topSpenders = Object.entries(expensesByUser)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, amount]) => ({ name, amount }));

      // Recent transactions (combine expenses and payments)
      const recentTransactions = [
        ...expenses.slice(0, 10).map(exp => ({ ...exp, type: 'expense' })),
        ...payments.slice(0, 10).map(pay => ({ ...pay, type: 'payment' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

      setReportData({
        totalExpenses,
        totalPayments,
        totalUsers,
        outstandingAmount,
        expensesByUser,
        paymentsByUser,
        dailyExpenses,
        dailyPayments,
        topSpenders,
        recentTransactions
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, customDateFrom, customDateTo]);

  const exportToPDF = (reportType: 'summary' | 'detailed' | 'individual', userName?: string) => {
    if (!reportData) return;

    setExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      const title = reportType === 'summary' ? 'Sales Summary Report' : 
                   reportType === 'individual' ? `Individual Report - ${userName}` : 
                   'Detailed Sales Report';
      doc.text(title, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);
      doc.text(`Period: ${dateRange === 'custom' && customDateFrom && customDateTo ? 
        `${format(customDateFrom, 'PPP')} - ${format(customDateTo, 'PPP')}` : 
        dateRange.replace('-', ' ')}`, 20, 40);

      let yPosition = 60;

      if (reportType === 'summary') {
        // Summary statistics
        doc.text(`Total Expenses: Rs. ${reportData.totalExpenses.toFixed(2)}`, 20, yPosition);
        doc.text(`Total Payments: Rs. ${reportData.totalPayments.toFixed(2)}`, 20, yPosition + 10);
        doc.text(`Outstanding Amount: Rs. ${reportData.outstandingAmount.toFixed(2)}`, 20, yPosition + 20);
        doc.text(`Active Users: ${reportData.totalUsers}`, 20, yPosition + 30);

        // Top spenders table
        yPosition += 50;
        doc.autoTable({
          head: [['User Name', 'Total Expenses', 'Payments Made', 'Outstanding']],
          body: reportData.topSpenders.map(spender => [
            spender.name,
            `Rs. ${spender.amount.toFixed(2)}`,
            `Rs. ${(reportData.paymentsByUser[spender.name] || 0).toFixed(2)}`,
            `Rs. ${(spender.amount - (reportData.paymentsByUser[spender.name] || 0)).toFixed(2)}`
          ]),
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      } else if (reportType === 'individual' && userName) {
        const userExpenses = reportData.expensesByUser[userName] || 0;
        const userPayments = reportData.paymentsByUser[userName] || 0;
        const userOutstanding = userExpenses - userPayments;

        doc.text(`User Expenses: Rs. ${userExpenses.toFixed(2)}`, 20, yPosition);
        doc.text(`User Payments: Rs. ${userPayments.toFixed(2)}`, 20, yPosition + 10);
        doc.text(`Outstanding: Rs. ${userOutstanding.toFixed(2)}`, 20, yPosition + 20);
      } else {
        // Detailed report with all data
        doc.autoTable({
          head: [['User Name', 'Expenses', 'Payments', 'Outstanding']],
          body: Object.keys(reportData.expensesByUser).map(user => [
            user,
            `Rs. ${reportData.expensesByUser[user].toFixed(2)}`,
            `Rs. ${(reportData.paymentsByUser[user] || 0).toFixed(2)}`,
            `Rs. ${(reportData.expensesByUser[user] - (reportData.paymentsByUser[user] || 0)).toFixed(2)}`
          ]),
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      }

      const filename = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);

      toast({
        title: "PDF Generated",
        description: `${title} downloaded successfully!`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = (reportType: 'summary' | 'detailed' | 'individual', userName?: string) => {
    if (!reportData) return;

    setExporting(true);
    try {
      let csvContent = '';
      const title = reportType === 'summary' ? 'Sales Summary Report' : 
                   reportType === 'individual' ? `Individual Report - ${userName}` : 
                   'Detailed Sales Report';
      
      csvContent += `${title}\n`;
      csvContent += `Generated on: ${format(new Date(), 'PPP')}\n`;
      csvContent += `Period: ${dateRange === 'custom' && customDateFrom && customDateTo ? 
        `${format(customDateFrom, 'PPP')} - ${format(customDateTo, 'PPP')}` : 
        dateRange.replace('-', ' ')}\n\n`;

      if (reportType === 'summary') {
        csvContent += `Total Expenses,Rs. ${reportData.totalExpenses.toFixed(2)}\n`;
        csvContent += `Total Payments,Rs. ${reportData.totalPayments.toFixed(2)}\n`;
        csvContent += `Outstanding Amount,Rs. ${reportData.outstandingAmount.toFixed(2)}\n`;
        csvContent += `Active Users,${reportData.totalUsers}\n\n`;
        
        csvContent += `User Name,Total Expenses,Payments Made,Outstanding\n`;
        reportData.topSpenders.forEach(spender => {
          csvContent += `${spender.name},Rs. ${spender.amount.toFixed(2)},Rs. ${(reportData.paymentsByUser[spender.name] || 0).toFixed(2)},Rs. ${(spender.amount - (reportData.paymentsByUser[spender.name] || 0)).toFixed(2)}\n`;
        });
      } else if (reportType === 'individual' && userName) {
        const userExpenses = reportData.expensesByUser[userName] || 0;
        const userPayments = reportData.paymentsByUser[userName] || 0;
        csvContent += `User Expenses,Rs. ${userExpenses.toFixed(2)}\n`;
        csvContent += `User Payments,Rs. ${userPayments.toFixed(2)}\n`;
        csvContent += `Outstanding,Rs. ${(userExpenses - userPayments).toFixed(2)}\n`;
      } else {
        csvContent += `User Name,Expenses,Payments,Outstanding\n`;
        Object.keys(reportData.expensesByUser).forEach(user => {
          csvContent += `${user},Rs. ${reportData.expensesByUser[user].toFixed(2)},Rs. ${(reportData.paymentsByUser[user] || 0).toFixed(2)},Rs. ${(reportData.expensesByUser[user] - (reportData.paymentsByUser[user] || 0)).toFixed(2)}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Excel Generated",
        description: `${title} downloaded successfully!`,
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate Excel report.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            Reports & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {dateRange === 'custom' && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <Button onClick={fetchReportData} variant="outline" disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-xl font-bold">Rs. {reportData.totalExpenses.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <p className="text-xl font-bold">Rs. {reportData.totalPayments.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                    <p className="text-xl font-bold">{reportData.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Outstanding</p>
                    <p className="text-xl font-bold">Rs. {reportData.outstandingAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Options */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary Reports</TabsTrigger>
              <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
              <TabsTrigger value="individual">Individual Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Summary Report Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => exportToPDF('summary')}
                      disabled={exporting}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export PDF
                    </Button>
                    <Button 
                      onClick={() => exportToExcel('summary')}
                      disabled={exporting}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Top Spenders */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Spenders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.topSpenders.slice(0, 5).map((spender, index) => (
                      <div key={spender.name} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span>{spender.name}</span>
                        </div>
                        <span className="font-semibold">Rs. {spender.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Report Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button 
                      onClick={() => exportToPDF('detailed')}
                      disabled={exporting}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export PDF
                    </Button>
                    <Button 
                      onClick={() => exportToExcel('detailed')}
                      disabled={exporting}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="individual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Individual User Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.keys(reportData.expensesByUser).map(userName => (
                      <div key={userName} className="flex justify-between items-center p-4 border rounded">
                        <div>
                          <h4 className="font-medium">{userName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Expenses: Rs. {reportData.expensesByUser[userName].toFixed(2)} | 
                            Payments: Rs. {(reportData.paymentsByUser[userName] || 0).toFixed(2)} | 
                            Outstanding: Rs. {(reportData.expensesByUser[userName] - (reportData.paymentsByUser[userName] || 0)).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            onClick={() => exportToPDF('individual', userName)}
                            disabled={exporting}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => exportToExcel('individual', userName)}
                            disabled={exporting}
                          >
                            <FileSpreadsheet className="w-4 h-4 mr-1" />
                            Excel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;
