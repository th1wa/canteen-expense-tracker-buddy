
import React from 'react';
import { format } from "date-fns";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

const PaymentHistory = ({ payments }: PaymentHistoryProps) => {
  if (payments.length === 0) {
    return null;
  }

  return (
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
  );
};

export default PaymentHistory;
