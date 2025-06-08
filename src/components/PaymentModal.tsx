
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
  totalAmount: number;
  payments: Payment[];
  onPaymentAdded: () => void;
}

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  userName, 
  totalAmount, 
  payments, 
  onPaymentAdded 
}: PaymentModalProps) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;
  const paymentProgress = Math.min((totalPaid / totalAmount) * 100, 100);
  const isFullyPaid = remainingBalance <= 0;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment for {userName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Amount:</span>
              <span className="font-semibold">Rs. {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Amount Paid:</span>
              <span className="font-semibold text-green-600">Rs. {totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted-foreground">Remaining Balance:</span>
              <span className="font-semibold text-orange-600">Rs. {remainingBalance.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Payment Progress</span>
                <span>{paymentProgress.toFixed(1)}%</span>
              </div>
              <Progress value={paymentProgress} className="h-2" />
            </div>
            
            {isFullyPaid && (
              <Badge className="w-full justify-center mt-3 bg-green-600">
                Bill Settled ✓
              </Badge>
            )}
          </div>

          {!isFullyPaid && (
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <Label htmlFor="paymentAmount">Payment Amount (Rs.)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${remainingBalance.toFixed(2)}`}
                  max={remainingBalance}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </form>
          )}

          {payments.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Payment History</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded">
                    <span>Rs. {payment.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
