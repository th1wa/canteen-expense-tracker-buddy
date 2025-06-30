
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { History, Calendar, DollarSign, Search, Filter, FilterX, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  user_name: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

interface PaymentHistoryProps {
  refreshTrigger: number;
}

const PaymentHistory = ({ refreshTrigger }: PaymentHistoryProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  const fetchPayments = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      // Filter for basic users to only see their own payments
      if (profile.role === 'user' && profile.username) {
        query = query.eq('user_name', profile.username);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching payments:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch payments');
      }

      if (!isMountedRef.current) return;

      const validPayments = (data || []).filter(payment => 
        payment && 
        typeof payment === 'object' && 
        payment.user_name && 
        payment.amount !== null &&
        payment.payment_date
      );

      setPayments(validPayments);
      setFilteredPayments(validPayments);
      
      // Extract unique users for filter dropdown
      const users = [...new Set(validPayments.map(payment => payment.user_name))].sort();
      setUniqueUsers(users);
    } catch (error) {
      console.error('Error fetching payments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        
        toast({
          title: "Error",
          description: `Failed to load payments: ${errorMessage}`,
          variant: "destructive"
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchPayments();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshTrigger, profile]);

  useEffect(() => {
    if (!Array.isArray(payments)) {
      setFilteredPayments([]);
      return;
    }

    let filtered = payments;

    // Filter by search term (user name)
    if (searchTerm?.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(payment =>
        payment?.user_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(payment =>
        payment?.payment_date === dateFilter
      );
    }

    // Filter by user
    if (userFilter && userFilter !== 'all') {
      filtered = filtered.filter(payment =>
        payment?.user_name === userFilter
      );
    }

    // Filter by amount range
    if (amountFilter && amountFilter !== 'all') {
      filtered = filtered.filter(payment => {
        const amount = Number(payment?.amount) || 0;
        switch (amountFilter) {
          case 'low': return amount <= 500;
          case 'medium': return amount > 500 && amount <= 2000;
          case 'high': return amount > 2000;
          default: return true;
        }
      });
    }

    setFilteredPayments(filtered);
  }, [searchTerm, dateFilter, userFilter, amountFilter, payments]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setUserFilter('');
    setAmountFilter('');
  };

  const hasActiveFilters = searchTerm || dateFilter || userFilter || amountFilter;

  const totalAmount = filteredPayments.reduce((sum, payment) => {
    const amount = Number(payment?.amount) || 0;
    return sum + amount;
  }, 0);

  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">Please log in to view payment history.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-muted-foreground">Loading payments...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">Error: {error}</div>
        <Button 
          onClick={fetchPayments}
          className="text-sm"
          variant="outline"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <History className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-semibold">Payment History</h2>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Filter Controls */}
      <Card className="bg-slate-50 dark:bg-slate-800/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Filters</span>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs h-8"
                >
                  <FilterX className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Filter */}
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value || '')}
                  className="text-sm h-9"
                />
              </div>

              {/* Date Filter */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value || '')}
                  className="text-sm h-9"
                />
              </div>

              {/* User Filter */}
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Amount Filter */}
              <Select value={amountFilter} onValueChange={setAmountFilter}>
                <SelectTrigger className="text-sm h-9">
                  <SelectValue placeholder="All amounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All amounts</SelectItem>
                  <SelectItem value="low">≤ Rs. 500</SelectItem>
                  <SelectItem value="medium">Rs. 501-2000</SelectItem>
                  <SelectItem value="high">{'>'} Rs. 2000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
                {hasActiveFilters && ` (filtered from ${payments.length})`}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {dateFilter && `on ${format(new Date(dateFilter), 'MMM dd, yyyy')}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                <DollarSign className="w-5 h-5" />
                Rs. {totalAmount.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">Total Amount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredPayments.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-3">💳</div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
              {hasActiveFilters ? 'No payments found matching your filters' : 'No payments recorded yet'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {hasActiveFilters ? 'Try adjusting your filters' : 'Payments will appear here once recorded'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredPayments.map((payment, index) => (
            <Card 
              key={payment.id} 
              className="hover:shadow-md transition-all duration-200 hover:scale-[1.01] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              style={{ 
                animationDelay: `${index * 50}ms`,
                animation: 'fadeInUp 0.5s ease-out forwards'
              }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {payment.user_name || 'Unknown User'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</span>
                        <span className="text-gray-400">•</span>
                        <span>{format(new Date(payment.created_at), 'hh:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      Rs. {Number(payment.amount).toFixed(2)}
                    </p>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mx-auto mt-1"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentHistory;
