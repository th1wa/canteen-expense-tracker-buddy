
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, User, DollarSign } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    setFilteredExpenses(filtered);
  }, [searchTerm, dateFilter, expenses]);

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
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by user name or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value || '')}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value || '')}
            className="w-auto"
          />
        </div>
      </div>

      <Card className="bg-amber-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-amber-700">
                {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''}
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

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm || dateFilter ? 'No expenses found matching your filters.' : 'No expenses recorded yet.'}
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
