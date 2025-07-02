import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, CreditCard, DollarSign, User } from "lucide-react";
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

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
      if (selectedUserName) {
        fetchUserTotalExpense(selectedUserName);
      }
    }
  }, [isOpen, selectedUserName]);

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
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_name', userNameToFetch);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return;
      }

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
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold">Record Payment</div>
                {selectedUserName && (
                  <div className="text-sm text-muted-foreground font-normal">
                    for {selectedUserName}
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {actualTotalExpense > 0 && (
                <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-950/30 dark:via-orange-950/30 dark:to-yellow-950/30 p-6 rounded-2xl border-2 border-red-200/50 dark:border-red-700/50 shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-200/20 to-orange-200/20 rounded-full -translate-y-16 translate-x-16"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        Outstanding Balance {selectedUserName && `for ${selectedUserName}`}
                      </p>
                    </div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      Rs. {actualTotalExpense.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="user-select" className="text-sm font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Select User
                    </Label>
                    <Select value={selectedUserName} onValueChange={handleUserChange}>
                      <SelectTrigger id="user-select" className="h-12 bg-white dark:bg-gray-900 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map(user => (
                          <SelectItem key={user} value={user} className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {user.charAt(0).toUpperCase()}
                              </div>
                              {user}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-sm font-semibold flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Payment Amount
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter payment amount"
                        required
                        className="h-12 pl-8 bg-white dark:bg-gray-900 border-2 hover:border-green-300 focus:border-green-500 transition-colors text-lg font-medium"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      Payment Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-medium h-12 bg-white dark:bg-gray-900 border-2 hover:border-purple-300 focus:border-purple-500 transition-colors",
                            !paymentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-4 w-4 flex-shrink-0" />
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
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Recording Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-3" />
                      Record Payment
                    </>
                  )}
                </Button>
              </form>

              <div className="border-t-2 border-dashed pt-6">
                <PaymentHistory refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
