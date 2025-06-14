
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
import { useAuth } from "@/contexts/AuthContext";

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
  const { profile } = useAuth();

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;
  const paymentProgress = Math.min((totalPaid / totalAmount) * 100, 100);
  const isFullyPaid = remainingBalance <= 0;

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile && (profile.role === 'admin' || profile.role === 'canteen');

  // Define a description for accessibility
  const dialogDescriptionId = "payment-modal-description";

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManagePayments) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to record payments",
        variant: "destructive"
      });
      return;
    }
    
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
      <DialogContent
        className="sm:max-w-md max-w-[95vw] max-h-[95vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300"
        aria-describedby={dialogDescriptionId}
      >
        <DialogHeader className="animate-in slide-in-from-top-4 duration-300">
          <DialogTitle className="text-lg sm:text-xl transition-colors">Payment for {userName}</DialogTitle>
        </DialogHeader>
        
        {/* Invisible element for accessibility */}
        <div id={dialogDescriptionId} className="sr-only">
          Enter and record a payment for this user. View payment history and remaining balance.
        </div>
        
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 delay-100">
          <div className="bg-muted p-3 sm:p-4 rounded-lg transition-all duration-300 hover:shadow-md border border-transparent hover:border-border">
            <div className="flex justify-between items-center mb-2 transition-all duration-200">
              <span className="text-xs sm:text-sm text-muted-foreground">Total Amount:</span>
              <span className="font-semibold text-sm sm:text-base transition-colors">Rs. {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2 transition-all duration-200">
              <span className="text-xs sm:text-sm text-muted-foreground">Amount Paid:</span>
              <span className="font-semibold text-green-600 text-sm sm:text-base transition-colors">Rs. {totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-3 transition-all duration-200">
              <span className="text-xs sm:text-sm text-muted-foreground">Remaining Balance:</span>
              <span className="font-semibold text-orange-600 text-sm sm:text-base transition-colors">Rs. {remainingBalance.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs transition-all duration-200">
                <span>Payment Progress</span>
                <span className="animate-in fade-in duration-500">{paymentProgress.toFixed(1)}%</span>
              </div>
              <Progress value={paymentProgress} className="h-2 transition-all duration-500" />
            </div>
            
            {isFullyPaid && (
              <Badge className="w-full justify-center mt-3 bg-green-600 animate-in zoom-in-95 duration-500">
                Bill Settled ✓
              </Badge>
            )}
          </div>

          {!isFullyPaid && canManagePayments && (
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
          )}

          {!canManagePayments && !isFullyPaid && (
            <div className="text-center py-4 animate-in fade-in duration-300 delay-300">
              <p className="text-sm text-muted-foreground transition-colors">
                Only admin and canteen staff can record payments
              </p>
            </div>
          )}

          {payments.length > 0 && (
            <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-300 delay-300">
              <h4 className="font-medium text-sm sm:text-base transition-colors">Payment History</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {payments.map((payment, index) => (
                  <div 
                    key={payment.id} 
                    className="flex justify-between items-center text-xs sm:text-sm bg-muted/50 p-2 rounded transition-all duration-200 hover:bg-muted hover:scale-[1.01] hover:shadow-sm animate-in slide-in-from-left-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="transition-colors">Rs. {payment.amount.toFixed(2)}</span>
                    <span className="text-muted-foreground transition-colors">
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
