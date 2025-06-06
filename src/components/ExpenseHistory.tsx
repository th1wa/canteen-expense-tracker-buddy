
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, User, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
      setFilteredExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = expenses;

    // Filter by search term (user name or note)
    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (expense.note && expense.note.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(expense =>
        expense.expense_date === dateFilter
      );
    }

    setFilteredExpenses(filtered);
  }, [searchTerm, dateFilter, expenses]);

  const totalAmount = filteredExpenses.reduce((sum, expense) => 
    sum + parseFloat(expense.amount.toString()), 0
  );

  if (loading) {
    return <div className="text-center py-8">Loading expense history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by user name or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
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
                      <span className="font-medium">{expense.user_name}</span>
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
                      Rs. {parseFloat(expense.amount.toString()).toFixed(2)}
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
