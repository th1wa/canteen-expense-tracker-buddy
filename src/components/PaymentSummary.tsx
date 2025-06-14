
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PaymentSummaryProps {
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  paymentProgress: number;
  isFullyPaid: boolean;
}

const PaymentSummary = ({ 
  totalAmount, 
  totalPaid, 
  remainingBalance, 
  paymentProgress, 
  isFullyPaid 
}: PaymentSummaryProps) => {
  return (
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
  );
};

export default PaymentSummary;
