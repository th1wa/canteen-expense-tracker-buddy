
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Expense {
  id: string;
  amount: number;
  expense_date: string;
  note: string | null;
  created_at: string;
}

interface UserExpenseModalProps {
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

const UserExpenseModal = ({ userName, isOpen, onClose }: UserExpenseModalProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (isOpen && userName) {
      fetchUserExpenses();
    }
  }, [isOpen, userName]);

  const fetchUserExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_name', userName)
        .order('expense_date', { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
      const total = data?.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0) || 0;
      setTotalAmount(total);
    } catch (error) {
      console.error('Error fetching user expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="animate-in slide-in-from-top-4 duration-300">
          <DialogTitle className="flex items-center gap-2 transition-colors">
            <DollarSign className="w-5 h-5 transition-transform hover:rotate-12" />
            {userName}'s Expense History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 delay-100">
          <Card className="bg-orange-50 hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-orange-800 transition-colors">Total Spending</h3>
                <p className="text-3xl font-bold text-orange-600 transition-all duration-300 hover:scale-105">Rs. {totalAmount.toFixed(2)}</p>
                <p className="text-sm text-orange-700 transition-colors">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="animate-pulse">Loading expenses...</span>
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 animate-in fade-in duration-300">
              No expenses found for {userName}
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <Card 
                  key={expense.id} 
                  className="hover:shadow-md transition-all duration-300 hover:scale-[1.01] animate-in slide-in-from-left-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500 transition-transform hover:scale-110" />
                        <div>
                          <p className="font-medium transition-colors">
                            {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                          </p>
                          {expense.note && (
                            <Badge variant="secondary" className="mt-1 transition-all duration-200 hover:scale-105">
                              {expense.note}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-orange-600 transition-all duration-300 hover:scale-105">
                          Rs. {parseFloat(expense.amount.toString()).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 transition-colors">
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
      </DialogContent>
    </Dialog>
  );
};

export default UserExpenseModal;
