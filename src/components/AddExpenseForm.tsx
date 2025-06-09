
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface AddExpenseFormProps {
  onExpenseAdded: () => void;
}

const AddExpenseForm = ({ onExpenseAdded }: AddExpenseFormProps) => {
  const [userName, setUserName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check if user can manage expenses (admin or canteen)
  const canManageExpenses = profile && (profile.role === 'admin' || profile.role === 'canteen');

  // Fetch existing user names for autocomplete
  useEffect(() => {
    const fetchUserNames = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('user_name')
        .order('user_name');
      
      if (!error && data) {
        const uniqueNames = [...new Set(data.map(item => item.user_name))];
        setUserSuggestions(uniqueNames);
      }
    };
    
    fetchUserNames();
  }, []);

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
      
      // Trigger refresh in parent
      onExpenseAdded();

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

  const filteredSuggestions = userSuggestions.filter(name =>
    name.toLowerCase().includes(userName.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Label htmlFor="userName" className="text-sm sm:text-base">User Name</Label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter user name (e.g., Kamal)"
            className="text-sm sm:text-base"
            required
          />
          {showSuggestions && userName && filteredSuggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto">
              {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 sm:p-3 hover:bg-accent cursor-pointer text-sm sm:text-base"
                  onClick={() => {
                    setUserName(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <Label htmlFor="amount" className="text-sm sm:text-base">Amount (Rs.)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="200.00"
            className="text-sm sm:text-base"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <Label htmlFor="expenseDate" className="text-sm sm:text-base">Date</Label>
          <Input
            id="expenseDate"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className="text-sm sm:text-base"
            required
          />
        </div>

        <div className="sm:col-span-1">
          <Label htmlFor="note" className="text-sm sm:text-base">Note (Optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tea, Lunch, etc."
            className="text-sm sm:text-base"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-orange-600 hover:bg-orange-700 text-sm sm:text-base py-2 sm:py-3"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Expense'}
      </Button>
    </form>
  );
};

export default AddExpenseForm;
