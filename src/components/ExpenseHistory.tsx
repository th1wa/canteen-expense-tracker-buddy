import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, User, DollarSign, Filter, FilterX, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useBasicUserExport } from "@/hooks/useBasicUserExport";

interface Expense {
  id: string;
  user_name: string;
  amount: number;
  expense_date: string;
  note: string | null;
  created_at: string;
}

interface ExpenseHistoryProps {
  refreshTrigger: number;
  onExpenseAdded: () => void;
}

const ExpenseHistory = ({ refreshTrigger, onExpenseAdded }: ExpenseHistoryProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState('');
  const [noteFilter, setNoteFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const { profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const { isExporting, exportToExcel, exportToPDF } = useBasicUserExport(profile?.username || '');

  const fetchExpenses = async () => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // If no profile after auth loading is complete, show appropriate message
    if (!profile) {
      setLoading(false);
      setError('Please log in to view expense history.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching expenses for profile:', profile);
      
      let query = supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      // For basic users, only show their own expenses
      if (profile.role === 'user' && profile.username) {
        console.log('Filtering expenses for user:', profile.username);
        query = query.eq('user_name', profile.username);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching expenses:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch expenses');
      }

      if (!isMountedRef.current) return;

      const validExpenses = (data || []).filter(expense => 
        expense && 
        typeof expense === 'object' && 
        expense.user_name && 
        expense.amount !== null &&
        expense.expense_date
      );

      console.log('Fetched expenses:', validExpenses.length);
      setExpenses(validExpenses);
      setFilteredExpenses(validExpenses);
      
      const users = [...new Set(validExpenses.map(expense => expense.user_name))].sort();
      setUniqueUsers(users);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        
        toast({
          title: "Error",
          description: `Failed to load expenses: ${errorMessage}`,
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
    fetchExpenses();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshTrigger, profile, authLoading]);

  useEffect(() => {
    if (!Array.isArray(expenses)) {
      setFilteredExpenses([]);
      return;
    }

    let filtered = expenses;

    if (searchTerm?.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense?.user_name?.toLowerCase().includes(searchLower) ||
        (expense?.note && expense.note.toLowerCase().includes(searchLower))
      );
    }

    if (dateFilter) {
      filtered = filtered.filter(expense =>
        expense?.expense_date === dateFilter
      );
    }

    if (userFilter && userFilter !== 'all') {
      filtered = filtered.filter(expense =>
        expense?.user_name === userFilter
      );
    }

    if (amountFilter && amountFilter !== 'all') {
      filtered = filtered.filter(expense => {
        const amount = Number(expense?.amount) || 0;
        switch (amountFilter) {
          case 'low': return amount <= 100;
          case 'medium': return amount > 100 && amount <= 500;
          case 'high': return amount > 500;
          default: return true;
        }
      });
    }

    if (noteFilter && noteFilter !== 'all') {
      filtered = filtered.filter(expense => {
        switch (noteFilter) {
          case 'with-notes': return expense?.note && expense.note.trim() !== '';
          case 'without-notes': return !expense?.note || expense.note.trim() === '';
          default: return true;
        }
      });
    }

    setFilteredExpenses(filtered);
  }, [searchTerm, dateFilter, userFilter, amountFilter, noteFilter, expenses]);

  const handleExportToExcel = () => {
    const exportData = filteredExpenses.map(expense => ({
      id: expense.id,
      user_name: expense.user_name,
      amount: expense.amount,
      date: expense.expense_date,
      note: expense.note,
      type: 'expense' as const
    }));
    exportToExcel(exportData, 'expenses');
  };

  const handleExportToPDF = () => {
    const exportData = filteredExpenses.map(expense => ({
      id: expense.id,
      user_name: expense.user_name,
      amount: expense.amount,
      date: expense.expense_date,
      note: expense.note,
      type: 'expense' as const
    }));
    exportToPDF(exportData, 'expenses');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('');
    setUserFilter('');
    setAmountFilter('');
    setNoteFilter('');
  };

  const hasActiveFilters = searchTerm || dateFilter || userFilter || amountFilter || noteFilter;

  const totalAmount = filteredExpenses.reduce((sum, expense) => {
    const amount = Number(expense?.amount) || 0;
    return sum + amount;
  }, 0);

  // Show loading while auth is loading
  if (authLoading) {
    return <div className="text-center py-6 text-sm">Loading...</div>;
  }

  // Show login message if no profile
  if (!profile) {
    return (
      <div className="text-center py-6">
        <div className="text-sm text-muted-foreground">Please log in to view expense history.</div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-6 text-sm">Loading expense history...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <div className="text-destructive mb-2 text-sm">Error: {error}</div>
        <Button 
          onClick={fetchExpenses}
          size="sm"
          variant="outline"
        >
          Try again
        </Button>
      </div>
    );
  }

  const isBasicUser = profile.role === 'user';

  return (
    <div className="space-y-3">
      {/* Header with Export Options for Basic Users */}
      {isBasicUser && (
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm">My Expense History</h3>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      disabled={isExporting || filteredExpenses.length === 0}
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
                        onClick={handleExportToExcel}
                        disabled={isExporting}
                      >
                        <FileText className="w-3 h-3 mr-2" />
                        Export to Excel
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={handleExportToPDF}
                        disabled={isExporting}
                      >
                        <FileText className="w-3 h-3 mr-2" />
                        Export to PDF
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Filter Controls */}
      <Card className="border-dashed">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium">Filters</span>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                <FilterX className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value || '')}
                className="pl-7 h-8 text-xs"
              />
            </div>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value || '')}
              className="h-8 text-xs"
            />

            {!isBasicUser && (
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={amountFilter} onValueChange={setAmountFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All amounts</SelectItem>
                <SelectItem value="low">≤ Rs. 100</SelectItem>
                <SelectItem value="medium">Rs. 101-500</SelectItem>
                <SelectItem value="high">{'>'} Rs. 500</SelectItem>
              </SelectContent>
            </Select>

            <Select value={noteFilter} onValueChange={setNoteFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Notes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="with-notes">With notes</SelectItem>
                <SelectItem value="without-notes">Without notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compact Summary */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <div className="text-xs text-amber-700">
              {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
              {hasActiveFilters && ` (from ${expenses.length})`}
            </div>
            <div className="text-sm font-semibold text-amber-600">
              Rs. {totalAmount.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Results */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-6 text-xs text-gray-500">
          {hasActiveFilters ? 'No expenses found matching filters.' : 'No expenses recorded yet.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-sm transition-shadow border-l-2 border-l-orange-400">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {!isBasicUser && (
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3 h-3 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{expense.user_name || 'Unknown'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(expense.expense_date), 'MMM dd')}</span>
                    </div>
                    {expense.note && (
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {expense.note.length > 20 ? `${expense.note.substring(0, 20)}...` : expense.note}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-orange-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Rs. {Number(expense.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(expense.created_at), 'hh:mm a')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseHistory;
