
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CreditCard, Loader2 } from "lucide-react";

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

  const quickAmountButtons = [
    Math.min(500, remainingBalance),
    Math.min(1000, remainingBalance),
    Math.min(2000, remainingBalance),
    remainingBalance
  ].filter((amount, index, arr) => amount > 0 && arr.indexOf(amount) === index);

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-950 border-blue-200 dark:border-blue-800 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Record Payment</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Enter payment amount below</p>
          </div>
        </div>

        <form onSubmit={handlePayment} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Payment Amount (Rs.)
            </Label>
            <div className="relative">
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={`Max: ${remainingBalance.toFixed(2)}`}
                max={remainingBalance}
                className="pl-8 text-lg font-medium border-2 border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-slate-800"
                required
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          {quickAmountButtons.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Amounts</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickAmountButtons.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentAmount(amount.toString())}
                    className="text-xs border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 dark:hover:border-blue-500"
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Recording Payment...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Record Payment
              </span>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
