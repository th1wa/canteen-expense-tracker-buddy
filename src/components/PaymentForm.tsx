
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PaymentFormProps {
  userName: string;
  remainingBalance: number;
  onPaymentAdded: () => void;
  onClose: () => void;
}

const PaymentForm = ({ userName, remainingBalance, onPaymentAdded, onClose }: PaymentFormProps) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive"
      });
      return;
    }

    if (amount > remainingBalance) {
      toast({
        title: "Payment Exceeds Balance",
        description: `Payment amount cannot exceed remaining balance of Rs. ${remainingBalance.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('payments' as any)
        .insert([
          {
            user_name: userName,
            amount: amount,
            payment_date: format(new Date(), 'yyyy-MM-dd')
          }
        ]);

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: `Rs. ${amount} payment recorded for ${userName}`,
      });

      setPaymentAmount('');
      onPaymentAdded();
      
      if (amount >= remainingBalance) {
        toast({
          title: "Bill Settled! 🎉",
          description: `${userName}'s bill has been fully paid`,
        });
        onClose();
      }

    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 delay-200">
      <div className="space-y-2">
        <Label htmlFor="paymentAmount" className="text-sm sm:text-base transition-colors">Payment Amount (Rs.)</Label>
        <Input
          id="paymentAmount"
          type="number"
          step="0.01"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder={`Max: ${remainingBalance.toFixed(2)}`}
          max={remainingBalance}
          className="text-sm sm:text-base transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full text-sm sm:text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            Recording...
          </span>
        ) : (
          'Record Payment'
        )}
      </Button>
    </form>
  );
};

export default PaymentForm;
