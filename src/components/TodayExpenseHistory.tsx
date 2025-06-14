
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, DollarSign, Clock } from "lucide-react";
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

interface TodayExpenseHistoryProps {
  refreshTrigger: number;
}

const TodayExpenseHistory = ({ refreshTrigger }: TodayExpenseHistoryProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('expense_date', today)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching today expenses:', error);
      setError('Failed to load today\'s expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayExpenses();
  }, [refreshTrigger]);

  const totalAmount = expenses.reduce((sum, expense) => 
    sum + Number(expense.amount), 0
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading today's expenses...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Today's Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Expenses - {format(new Date(), 'MMM dd, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Card className="bg-orange-50 mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-orange-700">
                  {expenses.length} transaction{expenses.length !== 1 ? 's' : ''} today
                </p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-600">
                  Total: Rs. {totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {expenses.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No expenses recorded today yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {expenses.map((expense, index) => (
              <Card 
                key={expense.id} 
                className="hover:shadow-sm transition-all duration-300 opacity-0 animate-fadeInUp"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">{expense.user_name}</span>
                      </div>
                      {expense.note && (
                        <Badge variant="secondary" className="text-xs">
                          {expense.note}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-orange-600 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Rs. {Number(expense.amount).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {format(new Date(expense.created_at), 'hh:mm a')}
                      </div>
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
          
          .animate-fadeInUp {
            animation: fadeInUp 0.5s ease-out forwards;
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default TodayExpenseHistory;
