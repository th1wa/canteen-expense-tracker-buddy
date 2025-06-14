
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import PaymentSummary from "@/components/PaymentSummary";
import PaymentForm from "@/components/PaymentForm";
import PaymentHistory from "@/components/PaymentHistory";

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
  const { profile } = useAuth();

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingBalance = totalAmount - totalPaid;
  const paymentProgress = Math.min((totalPaid / totalAmount) * 100, 100);
  const isFullyPaid = remainingBalance <= 0;

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile && (profile.role === 'admin' || profile.role === 'canteen');

  // Define a description for accessibility
  const dialogDescriptionId = "payment-modal-description";

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
          <PaymentSummary
            totalAmount={totalAmount}
            totalPaid={totalPaid}
            remainingBalance={remainingBalance}
            paymentProgress={paymentProgress}
            isFullyPaid={isFullyPaid}
          />

          {!isFullyPaid && canManagePayments && (
            <PaymentForm
              userName={userName}
              remainingBalance={remainingBalance}
              onPaymentAdded={onPaymentAdded}
              onClose={onClose}
            />
          )}

          {!canManagePayments && !isFullyPaid && (
            <div className="text-center py-4 animate-in fade-in duration-300 delay-300">
              <p className="text-sm text-muted-foreground transition-colors">
                Only admin and canteen staff can record payments
              </p>
            </div>
          )}

          <PaymentHistory payments={payments} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
