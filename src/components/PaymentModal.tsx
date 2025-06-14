
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import PaymentSummary from "@/components/PaymentSummary";
import PaymentForm from "@/components/PaymentForm";
import PaymentHistory from "@/components/PaymentHistory";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  // Validate props with proper error handling
  const validTotalAmount = Math.max(0, Number(totalAmount) || 0);
  const validPayments = Array.isArray(payments) ? payments.filter(p => p && typeof p === 'object') : [];
  const validUserName = userName?.trim() || 'Unknown User';

  const totalPaid = validPayments.reduce((sum, payment) => {
    const amount = Number(payment?.amount) || 0;
    return sum + amount;
  }, 0);
  
  const remainingBalance = Math.max(0, validTotalAmount - totalPaid);
  const paymentProgress = validTotalAmount > 0 ? Math.min((totalPaid / validTotalAmount) * 100, 100) : 0;
  const isFullyPaid = remainingBalance <= 0;

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile?.role === 'admin' || profile?.role === 'canteen';

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`
        ${isMobile 
          ? 'w-[95vw] h-[95vh] max-w-none rounded-lg m-2' 
          : 'sm:max-w-lg max-w-[95vw] max-h-[95vh]'
        } 
        overflow-hidden p-0 bg-gradient-to-br from-slate-50 to-blue-50 
        dark:from-slate-900 dark:to-blue-950 border-0 shadow-2xl
      `}>
        {/* Custom Header */}
        <div className="relative px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <DialogHeader>
            <DialogTitle className={`
              ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} 
              font-bold flex items-center gap-2 sm:gap-3
            `}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center text-sm sm:text-base">
                💳
              </div>
              <span className="truncate">Payment for {validUserName}</span>
            </DialogTitle>
            <DialogDescription className="text-blue-100 mt-1 text-sm">
              Manage payments and view payment history for this user
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <div className={`
          px-4 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6 
          overflow-y-auto ${isMobile ? 'max-h-[calc(95vh-80px)]' : 'max-h-[70vh]'}
          scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600
        `}>
          <PaymentSummary
            totalAmount={validTotalAmount}
            totalPaid={totalPaid}
            remainingBalance={remainingBalance}
            paymentProgress={paymentProgress}
            isFullyPaid={isFullyPaid}
          />

          {!isFullyPaid && canManagePayments && (
            <PaymentForm
              userName={validUserName}
              remainingBalance={remainingBalance}
              onPaymentAdded={onPaymentAdded}
              onClose={onClose}
            />
          )}

          {!canManagePayments && !isFullyPaid && (
            <div className="text-center py-4 sm:py-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="text-3xl sm:text-4xl mb-2">🔒</div>
              <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium px-2">
                Only admin and canteen staff can record payments
              </p>
            </div>
          )}

          <PaymentHistory payments={validPayments} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
