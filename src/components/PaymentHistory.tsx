import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Search, Filter, Download, RefreshCw, User, FileText, Plus, CreditCard, TrendingUp, Users, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBasicUserExport } from "@/hooks/useBasicUserExport";
import PaymentModal from "./PaymentModal";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  user_name: string;
  created_at: string;
}

interface PaymentHistoryProps {
  refreshTrigger?: number;
}

const PaymentHistory = ({ refreshTrigger = 0 }: PaymentHistoryProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUserForPayment, setSelectedUserForPayment] = useState<string>('');
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isExporting: isBasicUserExporting, exportToExcel: exportBasicUserToExcel, exportToPDF: exportBasicUserToPDF } = useBasicUserExport(profile?.username || '');

  const hasAccess = profile?.role === 'admin' || profile?.role === 'hr' || profile?.role === 'canteen' || profile?.role === 'user';
  const isBasicUser = profile?.role === 'user';
  const canAddPayments = profile?.role === 'admin' || profile?.role === 'canteen';

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      // Filter to user's own payments if basic user
      if (isBasicUser && profile?.username) {
        query = query.eq('user_name', profile.username);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payments:', error);
        toast({
          title: "Error",
          description: "Failed to fetch payment history",
          variant: "destructive",
        });
        return;
      }

      const paymentsData = data || [];
      setPayments(paymentsData);
      
      const users = Array.from(new Set(paymentsData.map(p => p.user_name))).sort();
      setUniqueUsers(users);
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: "An error occurred while fetching payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [refreshTrigger, profile]);

  useEffect(() => {
    let filtered = [...payments];

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedUser !== 'all') {
      filtered = filtered.filter(payment => payment.user_name === selectedUser);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'this-week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
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
            startDate = new Date(0);
          }
          break;
        default:
          startDate = new Date(0);
      }

      if (startDate) {
        filtered = filtered.filter(payment => {
          const paymentDate = new Date(payment.payment_date);
          return paymentDate >= startDate && paymentDate <= endDate;
        });
      }
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, selectedUser, dateRange, customDateFrom, customDateTo]);

  const handleBasicUserExportToExcel = () => {
    const exportData = filteredPayments.map(payment => ({
      id: payment.id,
      user_name: payment.user_name,
      amount: payment.amount,
      date: payment.payment_date,
      type: 'payment' as const
    }));
    exportBasicUserToExcel(exportData, 'payments');
  };

  const handleBasicUserExportToPDF = () => {
    const exportData = filteredPayments.map(payment => ({
      id: payment.id,
      user_name: payment.user_name,
      amount: payment.amount,
      date: payment.payment_date,
      type: 'payment' as const
    }));
    exportBasicUserToPDF(exportData, 'payments');
  };

  const getTotalAmount = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUser('all');
    setDateRange('all');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };

  const handleAddPayment = (userName?: string) => {
    if (userName) {
      setSelectedUserForPayment(userName);
    } else {
      setSelectedUserForPayment(uniqueUsers[0] || '');
    }
    setShowPaymentModal(true);
  };

  const handlePaymentAdded = () => {
    fetchPayments();
    setShowPaymentModal(false);
  };

  const exportToExcel = async (exportType: 'all' | 'filtered' | string) => {
    setIsExporting(true);
    try {
      let dataToExport: Payment[] = [];
      let filename = '';

      if (exportType === 'all') {
        dataToExport = payments;
        filename = `all_payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      } else if (exportType === 'filtered') {
        dataToExport = filteredPayments;
        filename = `filtered_payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      } else {
        // Export specific user
        dataToExport = payments.filter(p => p.user_name === exportType);
        filename = `${exportType.replace(/[^a-zA-Z0-9]/g, '_')}_payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      }

      if (dataToExport.length === 0) {
        toast({
          title: "No Data",
          description: "No payments to export",
          variant: "destructive",
        });
        return;
      }

      const csvHeaders = ['Date', 'User Name', 'Amount', 'Created At'];
      const csvData = dataToExport.map(payment => [
        format(new Date(payment.payment_date), 'yyyy-MM-dd'),
        payment.user_name,
        payment.amount.toString(),
        format(new Date(payment.created_at), 'yyyy-MM-dd HH:mm:ss')
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Payment history exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export payment history",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-lg font-medium mb-2">Access Denied</div>
        <div className="text-sm text-muted-foreground">You don't have permission to view payment history.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 border-2 shadow-xl">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-b">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold">
                  {isBasicUser ? 'My Payment History' : 'Payment History'}
                </CardTitle>
                <CardDescription className="text-sm">
                  {isBasicUser ? 'Your payment records and transactions' : 'Complete record of all payments and transactions'}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {canAddPayments && (
                <Button
                  onClick={() => handleAddPayment()}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment
                </Button>
              )}
              
              <Button
                onClick={fetchPayments}
                disabled={isLoading}
                variant="outline"
                className="border-2 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              
              {isBasicUser ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={isBasicUserExporting || filteredPayments.length === 0}
                      variant="outline"
                      className="border-2 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-3">
                      <div className="font-medium mb-3">Export Options</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        onClick={handleBasicUserExportToExcel}
                        disabled={isBasicUserExporting}
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        Export to Excel
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-950/20"
                        onClick={handleBasicUserExportToPDF}
                        disabled={isBasicUserExporting}
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        Export to PDF
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={isExporting || filteredPayments.length === 0}
                      variant="outline"
                      className="border-2 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-3">
                      <div className="font-medium mb-3">Export Options</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        onClick={() => exportToExcel('all')}
                        disabled={isExporting}
                      >
                        All Payments ({payments.length})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-950/20"
                        onClick={() => exportToExcel('filtered')}
                        disabled={isExporting}
                      >
                        Filtered Payments ({filteredPayments.length})
                      </Button>
                      <div className="border-t pt-2">
                        <div className="text-xs text-muted-foreground mb-2 font-medium">By User:</div>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {uniqueUsers.slice(0, 10).map(user => (
                            <Button
                              key={user}
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs h-8 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                              onClick={() => exportToExcel(user)}
                              disabled={isExporting}
                            >
                              <User className="w-3 h-3 mr-2" />
                              {user}
                            </Button>
                          ))}
                          {uniqueUsers.length > 10 && (
                            <div className="text-xs text-muted-foreground text-center py-1">
                              +{uniqueUsers.length - 10} more users
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Enhanced Filters */}
          <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={isBasicUser ? "Search..." : "Search user..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                  />
                </div>

                {!isBasicUser && (
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-11 border-2 hover:border-green-300 focus:border-green-500 transition-colors">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map(user => (
                        <SelectItem key={user} value={user}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {user.charAt(0).toUpperCase()}
                            </div>
                            {user}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-11 border-2 hover:border-purple-300 focus:border-purple-500 transition-colors">
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="h-11 border-2 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200 dark:border-purple-800">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-11 justify-start font-normal border-2 hover:border-purple-300 transition-colors",
                          !customDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateFrom ? format(customDateFrom, "MMM dd, yyyy") : "From date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                          "h-11 justify-start font-normal border-2 hover:border-purple-300 transition-colors",
                          !customDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateTo ? format(customDateTo, "MMM dd, yyyy") : "To date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
            </CardContent>
          </Card>

          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {filteredPayments.length}
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Total Payments</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border-2 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      Rs. {getTotalAmount().toLocaleString()}
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">Total Amount</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border-2 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {isBasicUser ? 1 : uniqueUsers.length}
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Active Users</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Payment List */}
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg font-medium text-muted-foreground">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium mb-2">
                  {payments.length === 0 ? "No payments found" : "No payments match the current filters"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {payments.length === 0 ? "Start by adding your first payment" : "Try adjusting your filters to see more results"}
                </p>
                {canAddPayments && payments.length === 0 && (
                  <Button
                    onClick={() => handleAddPayment()}
                    className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Payment
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto border-2 rounded-xl bg-white dark:bg-gray-900 p-2">
                {filteredPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/20 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {!isBasicUser && (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {payment.user_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-lg">{payment.user_name}</span>
                          </div>
                        )}
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                          #{(filteredPayments.length - index).toString().padStart(3, '0')}
                        </Badge>
                        {canAddPayments && !isBasicUser && (
                          <Button
                            onClick={() => handleAddPayment(payment.user_name)}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/40 text-green-700 dark:text-green-300 opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add More
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')} • {format(new Date(payment.created_at), 'HH:mm')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                        Rs. {payment.amount.toLocaleString()}
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                        <CreditCard className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          userName={selectedUserForPayment}
          totalExpense={0}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
};

export default PaymentHistory;
