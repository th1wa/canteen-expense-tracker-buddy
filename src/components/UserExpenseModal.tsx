
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            {userName}'s Expense History
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-orange-50">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-orange-800">Total Spending</h3>
                <p className="text-3xl font-bold text-orange-600">Rs. {totalAmount.toFixed(2)}</p>
                <p className="text-sm text-orange-700">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</p>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No expenses found for {userName}
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Card key={expense.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(expense.expense_date), 'MMM dd, yyyy')}
                          </p>
                          {expense.note && (
                            <Badge variant="secondary" className="mt-1">
                              {expense.note}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-orange-600">
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
      </DialogContent>
    </Dialog>
  );
};

export default UserExpenseModal;
