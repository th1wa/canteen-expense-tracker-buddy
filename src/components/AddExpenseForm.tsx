
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { UserNameInput } from "./UserNameInput";
import { ExpenseFormFields } from "./ExpenseFormFields";
import TodayExpenseHistory from "./TodayExpenseHistory";

interface AddExpenseFormProps {
  onExpenseAdded: () => void;
}

const AddExpenseForm = ({ onExpenseAdded }: AddExpenseFormProps) => {
  const [userName, setUserName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check if user can manage expenses (admin or canteen)
  const canManageExpenses = profile && (profile.role === 'admin' || profile.role === 'canteen');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageExpenses) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to add expenses",
        variant: "destructive"
      });
      return;
    }
    
    if (!userName.trim() || !amount.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both user name and amount",
        variant: "destructive"
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            user_name: userName.trim(),
            amount: amountNum,
            expense_date: expenseDate,
            note: note.trim() || null
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Added Rs. ${amountNum} expense for ${userName}`,
      });

      // Reset form
      setUserName('');
      setAmount('');
      setExpenseDate(format(new Date(), 'yyyy-MM-dd'));
      setNote('');
      
      // Trigger refresh in parent and history
      onExpenseAdded();
      setRefreshHistoryTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canManageExpenses) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to add expenses.</p>
        <p className="text-sm text-muted-foreground mt-2">Only admin and canteen staff can add expenses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <UserNameInput
            value={userName}
            onChange={setUserName}
            className="sm:col-span-2 lg:col-span-1"
          />

          <ExpenseFormFields
            amount={amount}
            onAmountChange={setAmount}
            expenseDate={expenseDate}
            onExpenseDateChange={setExpenseDate}
            note={note}
            onNoteChange={setNote}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-orange-600 hover:bg-orange-700 text-sm sm:text-base py-2 sm:py-3"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Expense'}
        </Button>
      </form>

      <TodayExpenseHistory refreshTrigger={refreshHistoryTrigger} />
    </div>
  );
};

export default AddExpenseForm;
