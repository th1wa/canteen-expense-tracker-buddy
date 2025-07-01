
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PaymentHistory from "./PaymentHistory";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  totalExpense: number;
  onPaymentAdded?: () => void;
}

const PaymentModal = ({ isOpen, onClose, userName, totalExpense, onPaymentAdded }: PaymentModalProps) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [selectedUserName, setSelectedUserName] = useState(userName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [actualTotalExpense, setActualTotalExpense] = useState(totalExpense);
  const { toast } = useToast();

  // Fetch available users and calculate total expense
  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
      if (selectedUserName) {
        fetchUserTotalExpense(selectedUserName);
      }
    }
  }, [isOpen, selectedUserName]);

  // Update selected user when userName prop changes
  useEffect(() => {
    setSelectedUserName(userName);
  }, [userName]);

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_name')
        .order('user_name');

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const userNames = data?.map(user => user.user_name) || [];
      setAvailableUsers(userNames);
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const fetchUserTotalExpense = async (userNameToFetch: string) => {
    if (!userNameToFetch) return;

    try {
      // Fetch total expenses for the user
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_name', userNameToFetch);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return;
      }

      // Fetch total payments for the user
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_name', userNameToFetch);

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError);
        return;
      }

      const totalExpenseAmount = expensesData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const totalPaymentAmount = paymentsData?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
      const remainingBalance = totalExpenseAmount - totalPaymentAmount;

      setActualTotalExpense(Math.max(0, remainingBalance));
    } catch (error) {
      console.error('Error calculating user total expense:', error);
    }
  };

  const handleUserChange = (newUserName: string) => {
    setSelectedUserName(newUserName);
    fetchUserTotalExpense(newUserName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUserName) {
      toast({
        title: "User Required",
        description: "Please select a user for the payment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('payments')
        .insert([
          {
            user_name: selectedUserName,
            amount: Number(amount),
            payment_date: format(paymentDate, 'yyyy-MM-dd'),
          }
        ]);

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: `Payment of Rs. ${amount} has been recorded for ${selectedUserName}`,
      });

      setAmount('');
      setPaymentDate(new Date());
      setRefreshTrigger(prev => prev + 1);
      
      // Call the onPaymentAdded callback if provided
      if (onPaymentAdded) {
        onPaymentAdded();
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                💳
              </div>
              Record Payment {selectedUserName && `for ${selectedUserName}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {actualTotalExpense > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mb-1">
                  Total Outstanding Expense {selectedUserName && `for ${selectedUserName}`}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  Rs. {actualTotalExpense.toFixed(2)}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-select" className="text-sm font-medium">Select User</Label>
                  <Select value={selectedUserName} onValueChange={handleUserChange}>
                    <SelectTrigger id="user-select" className="h-10">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map(user => (
                        <SelectItem key={user} value={user}>{user}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Payment Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    required
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !paymentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        {paymentDate ? format(paymentDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={paymentDate}
                        onSelect={(date) => date && setPaymentDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedUserName} 
                className="w-full h-11 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording Payment...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </form>

            <div className="border-t pt-4">
              <PaymentHistory refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
