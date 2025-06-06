
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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

  const filteredSuggestions = userSuggestions.filter(name =>
    name.toLowerCase().includes(userName.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Label htmlFor="userName">User Name</Label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Enter user name (e.g., Kamal)"
            required
          />
          {showSuggestions && userName && filteredSuggestions.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto">
              {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
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

        <div>
          <Label htmlFor="amount">Amount (Rs.)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="200.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="expenseDate">Date</Label>
          <Input
            id="expenseDate"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="note">Note (Optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tea, Lunch, etc."
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-orange-600 hover:bg-orange-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Expense'}
      </Button>
    </form>
  );
};

export default AddExpenseForm;
