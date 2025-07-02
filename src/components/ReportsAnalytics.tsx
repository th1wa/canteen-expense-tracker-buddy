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
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReportData {
  totalExpenses: number;
  totalPayments: number;
  totalUsers: number;
  outstandingAmount: number;
  expensesByUser: { [key: string]: number };
  paymentsByUser: { [key: string]: number };
  dailyExpenses: { date: string; amount: number }[];
  dailyPayments: { date: string; amount: number }[];
  topSpenders: { name: string; amount: number; payments: number; outstanding: number }[];
  recentTransactions: any[];
  averageExpensePerUser: number;
  collectionRate: number;
  activeUsers: number;
  settlementRate: number;
  peakExpenseDay: { date: string; amount: number };
  peakPaymentDay: { date: string; amount: number };
  monthlyGrowth: number;
  dailyAverage: number;
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

      console.log('Fetching data for date range:', { startDateStr, endDateStr });

      // Fetch current period data with better error handling
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

      if (expensesResult.error) {
        console.error('Expenses fetch error:', expensesResult.error);
        throw expensesResult.error;
      }

      if (paymentsResult.error) {
        console.error('Payments fetch error:', paymentsResult.error);
        throw paymentsResult.error;
      }

      // Fetch previous period for growth comparison with error handling
      const prevStartDate = new Date(startDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      const prevEndDate = new Date(endDate);
      prevEndDate.setMonth(prevEndDate.getMonth() - 1);

      const [prevExpensesResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('amount')
          .gte('expense_date', format(prevStartDate, 'yyyy-MM-dd'))
          .lte('expense_date', format(prevEndDate, 'yyyy-MM-dd'))
      ]);

      const expenses = expensesResult.data || [];
      const payments = paymentsResult.data || [];
      const prevExpenses = prevExpensesResult.data || [];

      console.log('Fetched data:', { expenses: expenses.length, payments: payments.length });

      // Calculate totals with better null handling
      const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount?.toString() || '0') || 0), 0);
      const totalPayments = payments.reduce((sum, pay) => sum + (parseFloat(pay.amount?.toString() || '0') || 0), 0);
      const outstandingAmount = totalExpenses - totalPayments;
      const prevTotalExpenses = prevExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount?.toString() || '0') || 0), 0);
      const monthlyGrowth = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;

      // Get unique users with better handling
      const expenseUsers = expenses.map(e => e.user_name).filter(Boolean);
      const paymentUsers = payments.map(p => p.user_name).filter(Boolean);
      const allUsers = new Set([...expenseUsers, ...paymentUsers]);
      const totalUsers = allUsers.size;
      const activeUsers = new Set(expenseUsers).size;

      // Calculate rates and averages with safety checks
      const averageExpensePerUser = totalUsers > 0 ? totalExpenses / totalUsers : 0;
      const collectionRate = totalExpenses > 0 ? (totalPayments / totalExpenses) * 100 : 0;
      const settlementRate = totalUsers > 0 ? (Array.from(allUsers).filter(user => {
        const userExpenses = expenses.filter(e => e.user_name === user).reduce((sum, e) => sum + (parseFloat(e.amount?.toString() || '0') || 0), 0);
        const userPayments = payments.filter(p => p.user_name === user).reduce((sum, p) => sum + (parseFloat(p.amount?.toString() || '0') || 0), 0);
        return userExpenses <= userPayments;
      }).length / totalUsers) * 100 : 0;

      // Calculate daily average with safety
      const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));
      const dailyAverage = totalExpenses / daysDiff;

      // Expenses by user with better handling
      const expensesByUser: { [key: string]: number } = {};
      expenses.forEach(exp => {
        if (exp.user_name && exp.amount) {
          expensesByUser[exp.user_name] = (expensesByUser[exp.user_name] || 0) + (parseFloat(exp.amount.toString()) || 0);
        }
      });

      // Payments by user with better handling
      const paymentsByUser: { [key: string]: number } = {};
      payments.forEach(pay => {
        if (pay.user_name && pay.amount) {
          paymentsByUser[pay.user_name] = (paymentsByUser[pay.user_name] || 0) + (parseFloat(pay.amount.toString()) || 0);
        }
      });

      // Daily expenses and payments with better handling
      const dailyExpenseMap: { [key: string]: number } = {};
      const dailyPaymentMap: { [key: string]: number } = {};

      expenses.forEach(exp => {
        if (exp.expense_date && exp.amount) {
          dailyExpenseMap[exp.expense_date] = (dailyExpenseMap[exp.expense_date] || 0) + (parseFloat(exp.amount.toString()) || 0);
        }
      });

      payments.forEach(pay => {
        if (pay.payment_date && pay.amount) {
          dailyPaymentMap[pay.payment_date] = (dailyPaymentMap[pay.payment_date] || 0) + (parseFloat(pay.amount.toString()) || 0);
        }
      });

      const dailyExpenses = Object.entries(dailyExpenseMap).map(([date, amount]) => ({ date, amount }));
      const dailyPayments = Object.entries(dailyPaymentMap).map(([date, amount]) => ({ date, amount }));

      // Find peak days with safety
      const peakExpenseDay = dailyExpenses.length > 0 
        ? dailyExpenses.reduce((max, day) => day.amount > max.amount ? day : max, { date: '', amount: 0 })
        : { date: '', amount: 0 };
      const peakPaymentDay = dailyPayments.length > 0 
        ? dailyPayments.reduce((max, day) => day.amount > max.amount ? day : max, { date: '', amount: 0 })
        : { date: '', amount: 0 };

      // Enhanced top spenders with better safety
      const topSpenders = Object.entries(expensesByUser)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .map(([name, amount]) => ({
          name,
          amount,
          payments: paymentsByUser[name] || 0,
          outstanding: amount - (paymentsByUser[name] || 0)
        }));

      // Recent transactions with better handling
      const recentTransactions = [
        ...expenses.slice(0, 15).map(exp => ({ ...exp, type: 'expense' })),
        ...payments.slice(0, 15).map(pay => ({ ...pay, type: 'payment' }))
      ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 30);

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
        recentTransactions,
        averageExpensePerUser,
        collectionRate,
        activeUsers,
        settlementRate,
        peakExpenseDay,
        peakPaymentDay,
        monthlyGrowth,
        dailyAverage
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange, customDateFrom, customDateTo]);

  const exportToPDF = async (reportType: 'summary' | 'detailed' | 'individual', userName?: string) => {
    if (!reportData) {
      toast({
        title: "No Data",
        description: "No report data available to export.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      console.log('Starting PDF export:', { reportType, userName });
      
      // Dynamic import to avoid build issues
      const jsPDF = (await import('jspdf')).default;
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Header with better error handling
      doc.setFontSize(20);
      const title = reportType === 'summary' ? 'Sales Summary Report' : 
                   reportType === 'individual' ? `Individual Report - ${userName || 'Unknown'}` : 
                   'Detailed Sales Report';
      doc.text(title, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);
      doc.text(`Period: ${dateRange === 'custom' && customDateFrom && customDateTo ? 
        `${format(customDateFrom, 'PPP')} - ${format(customDateTo, 'PPP')}` : 
        dateRange.replace('-', ' ')}`, 20, 40);

      let yPosition = 60;

      if (reportType === 'summary') {
        // Enhanced summary statistics with safety checks
        const stats = [
          ['Total Expenses', `Rs. ${(reportData.totalExpenses || 0).toFixed(2)}`],
          ['Total Payments', `Rs. ${(reportData.totalPayments || 0).toFixed(2)}`],
          ['Outstanding Amount', `Rs. ${(reportData.outstandingAmount || 0).toFixed(2)}`],
          ['Total Users', (reportData.totalUsers || 0).toString()],
          ['Active Users', (reportData.activeUsers || 0).toString()],
          ['Collection Rate', `${(reportData.collectionRate || 0).toFixed(1)}%`],
          ['Settlement Rate', `${(reportData.settlementRate || 0).toFixed(1)}%`],
          ['Average per User', `Rs. ${(reportData.averageExpensePerUser || 0).toFixed(2)}`],
          ['Daily Average', `Rs. ${(reportData.dailyAverage || 0).toFixed(2)}`],
          ['Monthly Growth', `${(reportData.monthlyGrowth || 0).toFixed(1)}%`]
        ];

        // Use autoTable safely
        (doc as any).autoTable({
          head: [['Metric', 'Value']],
          body: stats,
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });

        // Top spenders table with safety checks
        if (reportData.topSpenders && reportData.topSpenders.length > 0) {
          yPosition = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 20 : yPosition + 100;
          doc.text('Top Spenders Analysis', 20, yPosition);
          yPosition += 10;

          (doc as any).autoTable({
            head: [['User Name', 'Total Expenses', 'Payments Made', 'Outstanding', 'Status']],
            body: reportData.topSpenders.slice(0, 10).map(spender => [
              spender.name || 'Unknown',
              `Rs. ${(spender.amount || 0).toFixed(2)}`,
              `Rs. ${(spender.payments || 0).toFixed(2)}`,
              `Rs. ${(spender.outstanding || 0).toFixed(2)}`,
              (spender.outstanding || 0) <= 0 ? 'Settled' : 'Pending'
            ]),
            startY: yPosition,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [41, 128, 185] }
          });
        }
      } else if (reportType === 'individual' && userName) {
        const userExpenses = reportData.expensesByUser[userName] || 0;
        const userPayments = reportData.paymentsByUser[userName] || 0;
        const userOutstanding = userExpenses - userPayments;

        const userStats = [
          ['User Expenses', `Rs. ${userExpenses.toFixed(2)}`],
          ['User Payments', `Rs. ${userPayments.toFixed(2)}`],
          ['Outstanding', `Rs. ${userOutstanding.toFixed(2)}`],
          ['Status', userOutstanding <= 0 ? 'Settled' : 'Pending'],
          ['Collection Rate', `${userExpenses > 0 ? ((userPayments / userExpenses) * 100).toFixed(1) : 0}%`]
        ];

        (doc as any).autoTable({
          head: [['Metric', 'Value']],
          body: userStats,
          startY: yPosition,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      } else {
        // Detailed report with all users and safety checks
        const userReportData = Object.keys(reportData.expensesByUser || {}).map(user => [
          user,
          `Rs. ${(reportData.expensesByUser[user] || 0).toFixed(2)}`,
          `Rs. ${(reportData.paymentsByUser[user] || 0).toFixed(2)}`,
          `Rs. ${((reportData.expensesByUser[user] || 0) - (reportData.paymentsByUser[user] || 0)).toFixed(2)}`,
          `${(reportData.expensesByUser[user] || 0) > 0 ? (((reportData.paymentsByUser[user] || 0) / (reportData.expensesByUser[user] || 1)) * 100).toFixed(1) : 0}%`,
          ((reportData.expensesByUser[user] || 0) - (reportData.paymentsByUser[user] || 0)) <= 0 ? 'Settled' : 'Pending'
        ]);

        if (userReportData.length > 0) {
          (doc as any).autoTable({
            head: [['User Name', 'Expenses', 'Payments', 'Outstanding', 'Collection %', 'Status']],
            body: userReportData,
            startY: yPosition,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
          });
        }
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
        description: "Failed to generate PDF report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async (reportType: 'summary' | 'detailed' | 'individual', userName?: string) => {
    if (!reportData) {
      toast({
        title: "No Data",
        description: "No report data available to export.",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    try {
      console.log('Starting Excel export:', { reportType, userName });
      
      let csvContent = '';
      const title = reportType === 'summary' ? 'Sales Summary Report' : 
                   reportType === 'individual' ? `Individual Report - ${userName || 'Unknown'}` : 
                   'Detailed Sales Report';
      
      csvContent += `${title}\n`;
      csvContent += `Generated on: ${format(new Date(), 'PPP')}\n`;
      csvContent += `Period: ${dateRange === 'custom' && customDateFrom && customDateTo ? 
        `${format(customDateFrom, 'PPP')} - ${format(customDateTo, 'PPP')}` : 
        dateRange.replace('-', ' ')}\n\n`;

      if (reportType === 'summary') {
        csvContent += `Total Expenses,Rs. ${(reportData.totalExpenses || 0).toFixed(2)}\n`;
        csvContent += `Total Payments,Rs. ${(reportData.totalPayments || 0).toFixed(2)}\n`;
        csvContent += `Outstanding Amount,Rs. ${(reportData.outstandingAmount || 0).toFixed(2)}\n`;
        csvContent += `Total Users,${reportData.totalUsers || 0}\n`;
        csvContent += `Active Users,${reportData.activeUsers || 0}\n`;
        csvContent += `Collection Rate,${(reportData.collectionRate || 0).toFixed(1)}%\n`;
        csvContent += `Settlement Rate,${(reportData.settlementRate || 0).toFixed(1)}%\n`;
        csvContent += `Average per User,Rs. ${(reportData.averageExpensePerUser || 0).toFixed(2)}\n`;
        csvContent += `Daily Average,Rs. ${(reportData.dailyAverage || 0).toFixed(2)}\n`;
        csvContent += `Monthly Growth,${(reportData.monthlyGrowth || 0).toFixed(1)}%\n\n`;
        
        if (reportData.topSpenders && reportData.topSpenders.length > 0) {
          csvContent += `User Name,Total Expenses,Payments Made,Outstanding,Status\n`;
          reportData.topSpenders.forEach(spender => {
            csvContent += `${spender.name || 'Unknown'},Rs. ${(spender.amount || 0).toFixed(2)},Rs. ${(spender.payments || 0).toFixed(2)},Rs. ${(spender.outstanding || 0).toFixed(2)},${(spender.outstanding || 0) <= 0 ? 'Settled' : 'Pending'}\n`;
          });
        }
      } else if (reportType === 'individual' && userName) {
        const userExpenses = reportData.expensesByUser[userName] || 0;
        const userPayments = reportData.paymentsByUser[userName] || 0;
        csvContent += `User Expenses,Rs. ${userExpenses.toFixed(2)}\n`;
        csvContent += `User Payments,Rs. ${userPayments.toFixed(2)}\n`;
        csvContent += `Outstanding,Rs. ${(userExpenses - userPayments).toFixed(2)}\n`;
        csvContent += `Status,${(userExpenses - userPayments) <= 0 ? 'Settled' : 'Pending'}\n`;
      } else {
        csvContent += `User Name,Expenses,Payments,Outstanding,Collection %,Status\n`;
        Object.keys(reportData.expensesByUser || {}).forEach(user => {
          const expenses = reportData.expensesByUser[user] || 0;
          const payments = reportData.paymentsByUser[user] || 0;
          const outstanding = expenses - payments;
          const collectionRate = expenses > 0 ? ((payments / expenses) * 100).toFixed(1) : '0';
          csvContent += `${user},Rs. ${expenses.toFixed(2)},Rs. ${payments.toFixed(2)},Rs. ${outstanding.toFixed(2)},${collectionRate}%,${outstanding <= 0 ? 'Settled' : 'Pending'}\n`;
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
      URL.revokeObjectURL(url);

      toast({
        title: "Excel Generated",
        description: `${title} downloaded successfully!`,
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Error",
        description: "Failed to generate Excel report. Please try again.",
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
        <Button onClick={fetchReportData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileBarChart className="w-5 h-5" />
            Reports & Analytics Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-40">
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
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, "PPP") : "From"}
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
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal",
                        !customDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, "PPP") : "To"}
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

            <Button onClick={fetchReportData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-sm font-bold truncate">Rs. {(reportData.totalExpenses || 0).toFixed(0)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Collections</p>
                  <p className="text-sm font-bold truncate">Rs. {(reportData.totalPayments || 0).toFixed(0)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-sm font-bold truncate">Rs. {(reportData.outstandingAmount || 0).toFixed(0)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Users</p>
                  <p className="text-sm font-bold">{reportData.activeUsers || 0}/{reportData.totalUsers || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-500" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Collection Rate</p>
                  <p className="text-sm font-bold">{(reportData.collectionRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-500" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Daily Avg</p>
                  <p className="text-sm font-bold truncate">Rs. {(reportData.dailyAverage || 0).toFixed(0)}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Settlement Rate</p>
              <p className="text-sm font-semibold">{(reportData.settlementRate || 0).toFixed(1)}%</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Avg per User</p>
              <p className="text-sm font-semibold">Rs. {(reportData.averageExpensePerUser || 0).toFixed(0)}</p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Monthly Growth</p>
              <p className={cn("text-sm font-semibold flex items-center justify-center gap-1", 
                (reportData.monthlyGrowth || 0) >= 0 ? "text-green-600" : "text-red-600")}>
                {(reportData.monthlyGrowth || 0) >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(reportData.monthlyGrowth || 0).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-2 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Peak Day</p>
              <p className="text-sm font-semibold">Rs. {(reportData.peakExpenseDay?.amount || 0).toFixed(0)}</p>
            </div>
          </div>

          {/* Export Options */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="detailed">Detailed</TabsTrigger>
              <TabsTrigger value="individual">Individual</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Card className="flex-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Summary Report Export</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => exportToPDF('summary')}
                        disabled={exporting}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        {exporting ? 'Generating...' : 'PDF'}
                      </Button>
                      <Button 
                        onClick={() => exportToExcel('summary')}
                        disabled={exporting}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        {exporting ? 'Generating...' : 'Excel'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Spenders */}
                <Card className="flex-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Spenders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(reportData.topSpenders || []).slice(0, 6).map((spender, index) => (
                        <div key={spender.name} className="flex justify-between items-center text-xs p-1 bg-muted rounded">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs px-1">#{index + 1}</Badge>
                            <span className="truncate max-w-20">{spender.name || 'Unknown'}</span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-green-600">Rs. {(spender.amount || 0).toFixed(0)}</span>
                            {(spender.outstanding || 0) > 0 && (
                              <span className="text-red-600">(-{(spender.outstanding || 0).toFixed(0)})</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Detailed Report Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => exportToPDF('detailed')}
                      disabled={exporting}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      {exporting ? 'Generating...' : 'PDF'}
                    </Button>
                    <Button 
                      onClick={() => exportToExcel('detailed')}
                      disabled={exporting}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      {exporting ? 'Generating...' : 'Excel'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="individual" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Individual User Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.keys(reportData.expensesByUser || {}).slice(0, 10).map(userName => (
                      <div key={userName} className="flex justify-between items-center p-2 border rounded text-xs">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{userName}</h4>
                          <p className="text-muted-foreground">
                            Exp: Rs. {(reportData.expensesByUser[userName] || 0).toFixed(0)} | 
                            Pay: Rs. {(reportData.paymentsByUser[userName] || 0).toFixed(0)} | 
                            Rem: Rs. {((reportData.expensesByUser[userName] || 0) - (reportData.paymentsByUser[userName] || 0)).toFixed(0)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => exportToPDF('individual', userName)}
                            disabled={exporting}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => exportToExcel('individual', userName)}
                            disabled={exporting}
                            className="text-xs px-2 py-1 h-auto"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {(reportData.recentTransactions || []).slice(0, 8).map((transaction, index) => (
                  <div key={transaction.id || index} className="flex justify-between items-center text-xs p-1 rounded hover:bg-muted">
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.type === 'expense' ? 'destructive' : 'default'} className="text-xs px-1">
                        {transaction.type === 'expense' ? 'EXP' : 'PAY'}
                      </Badge>
                      <span className="truncate max-w-24">{transaction.user_name || 'Unknown'}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(transaction.expense_date || transaction.payment_date || new Date()), 'MMM dd')}
                      </span>
                    </div>
                    <span className={cn("font-medium", 
                      transaction.type === 'expense' ? "text-red-600" : "text-green-600"
                    )}>
                      Rs. {(parseFloat(transaction.amount?.toString() || '0') || 0).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;
