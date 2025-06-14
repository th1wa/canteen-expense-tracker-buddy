
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import PaymentSummary from "@/components/PaymentSummary";
import PaymentForm from "@/components/PaymentForm";
import PaymentHistory from "@/components/PaymentHistory";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 border-0 shadow-2xl [&>button]:hidden">
        {/* Custom Header with single close button */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                💳
              </div>
              Payment for {userName}
            </DialogTitle>
          </DialogHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-4 top-4 text-white hover:bg-white/20 rounded-full w-8 h-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[70vh]">
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
            <div className="text-center py-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="text-4xl mb-2">🔒</div>
              <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
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
