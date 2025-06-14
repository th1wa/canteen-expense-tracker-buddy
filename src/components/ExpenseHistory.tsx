
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, User, DollarSign, Filter, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
}

const ExpenseHistory = ({ refreshTrigger }: ExpenseHistoryProps) => {
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
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter for basic users to only see their own expenses
      if (profile.role === 'user' && profile.username) {
        query = query.eq('user_name', profile.username);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching expenses:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch expenses');
      }

      const validExpenses = (data || []).filter(expense => 
        expense && 
        typeof expense === 'object' && 
        expense.user_name && 
        expense.amount !== null &&
        expense.expense_date
      );

      setExpenses(validExpenses);
      setFilteredExpenses(validExpenses);
      
      // Extract unique users for filter dropdown
      const users = [...new Set(validExpenses.map(expense => expense.user_name))].sort();
      setUniqueUsers(users);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: `Failed to load expenses: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger, profile]);

  useEffect(() => {
    if (!Array.isArray(expenses)) {
      setFilteredExpenses([]);
      return;
    }

    let filtered = expenses;

    // Filter by search term (user name or note)
    if (searchTerm?.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense?.user_name?.toLowerCase().includes(searchLower) ||
        (expense?.note && expense.note.toLowerCase().includes(searchLower))
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(expense =>
        expense?.expense_date === dateFilter
      );
    }

    // Filter by user
    if (userFilter && userFilter !== 'all') {
      filtered = filtered.filter(expense =>
        expense?.user_name === userFilter
      );
    }

    // Filter by amount range
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

    // Filter by note presence
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

  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">Please log in to view expense history.</div>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading expense history...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">Error: {error}</div>
        <button 
          onClick={fetchExpenses}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
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
              className="text-xs"
            >
              <FilterX className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {/* Search Filter */}
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value || '')}
              className="text-xs"
            />
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value || '')}
              className="text-xs"
            />
          </div>

          {/* User Filter */}
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="text-xs">
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
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="All amounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All amounts</SelectItem>
              <SelectItem value="low">≤ Rs. 100</SelectItem>
              <SelectItem value="medium">Rs. 101-500</SelectItem>
              <SelectItem value="high">> Rs. 500</SelectItem>
            </SelectContent>
          </Select>

          {/* Note Filter */}
          <Select value={noteFilter} onValueChange={setNoteFilter}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="All notes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notes</SelectItem>
              <SelectItem value="with-notes">With notes</SelectItem>
              <SelectItem value="without-notes">Without notes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="bg-amber-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-amber-700">
                {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
                {hasActiveFilters && ` (filtered from ${expenses.length})`}
                {dateFilter && ` on ${format(new Date(dateFilter), 'MMM dd, yyyy')}`}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">
                Total: Rs. {totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {hasActiveFilters ? 'No expenses found matching your filters.' : 'No expenses recorded yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => (
            <Card key={expense.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{expense.user_name || 'Unknown User'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {expense.note && (
                      <Badge variant="secondary">
                        {expense.note}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-orange-600 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
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
