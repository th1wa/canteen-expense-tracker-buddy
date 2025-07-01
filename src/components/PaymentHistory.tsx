import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Search, Filter, Download, RefreshCw, User, FileText } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBasicUserExport } from "@/hooks/useBasicUserExport";
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
  const { toast } = useToast();
  const { profile } = useAuth();
  const { isExporting: isBasicUserExporting, exportToExcel: exportBasicUserToExcel, exportToPDF: exportBasicUserToPDF } = useBasicUserExport(profile?.username || '');

  const hasAccess = profile?.role === 'admin' || profile?.role === 'hr' || profile?.role === 'canteen' || profile?.role === 'user';
  const isBasicUser = profile?.role === 'user';

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
  }, [refreshTrigger]);

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
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">You don't have permission to view payment history.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                💳 {isBasicUser ? 'My Payment History' : 'Payment History'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isBasicUser ? 'Your payment records' : 'Complete record of all payments'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchPayments}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Loading
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </>
                )}
              </Button>
              
              {/* Export Options */}
              {isBasicUser ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={isBasicUserExporting || filteredPayments.length === 0}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="end">
                    <div className="space-y-2">
                      <div className="text-xs font-medium mb-2">Export Options</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={handleBasicUserExportToExcel}
                        disabled={isBasicUserExporting}
                      >
                        <FileText className="w-3 h-3 mr-2" />
                        Export to Excel
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={handleBasicUserExportToPDF}
                        disabled={isBasicUserExporting}
                      >
                        <FileText className="w-3 h-3 mr-2" />
                        Export to PDF
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                
                <div className="relative">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        disabled={isExporting || filteredPayments.length === 0}
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56" align="end">
                      <div className="space-y-2">
                        <div className="text-xs font-medium mb-2">Export Options</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => exportToExcel('all')}
                          disabled={isExporting}
                        >
                          All Payments ({payments.length})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => exportToExcel('filtered')}
                          disabled={isExporting}
                        >
                          Filtered Payments ({filteredPayments.length})
                        </Button>
                        <div className="border-t pt-2">
                          <div className="text-xs text-muted-foreground mb-1">By User:</div>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {uniqueUsers.slice(0, 10).map(user => (
                              <Button
                                key={user}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs h-7"
                                onClick={() => exportToExcel(user)}
                                disabled={isExporting}
                              >
                                <User className="w-3 h-3 mr-1" />
                                {user}
                              </Button>
                            ))}
                            {uniqueUsers.length > 10 && (
                              <div className="text-xs text-muted-foreground text-center">
                                +{uniqueUsers.length - 10} more users
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Compact Filters */}
          <Card className="border-dashed">
            <CardContent className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder={isBasicUser ? "Search..." : "Search user..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>

                {!isBasicUser && (
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {uniqueUsers.map(user => (
                        <SelectItem key={user} value={user}>{user}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="h-8 text-xs">
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
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Custom Date Range */}
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 justify-start text-xs font-normal",
                          !customDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {customDateFrom ? format(customDateFrom, "MMM dd") : "From"}
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
                        size="sm"
                        className={cn(
                          "h-8 justify-start text-xs font-normal",
                          !customDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {customDateTo ? format(customDateTo, "MMM dd") : "To"}
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

          {/* Compact Summary */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="text-lg font-bold">{filteredPayments.length}</div>
                <p className="text-xs text-muted-foreground">Payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-lg font-bold text-green-600">
                  Rs. {getTotalAmount().toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-lg font-bold">{isBasicUser ? 1 : uniqueUsers.length}</div>
                <p className="text-xs text-muted-foreground">Users</p>
              </CardContent>
            </Card>
          </div>

          {/* Compact Payment List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-xs text-muted-foreground mt-2">Loading payments...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {payments.length === 0 ? "No payments found" : "No payments match the current filters"}
                </p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-1 border rounded-lg">
                {filteredPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 bg-card border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!isBasicUser && <span className="font-medium text-sm">{payment.user_name}</span>}
                        <Badge variant="outline" className="text-xs px-1">
                          #{(filteredPayments.length - index).toString().padStart(3, '0')}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')} • {format(new Date(payment.created_at), 'HH:mm')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">
                        Rs. {payment.amount.toFixed(2)}
                      </div>
                      <Badge variant="secondary" className="text-xs">
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
    </div>
  );
};

export default PaymentHistory;
