
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, CheckCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-0 shadow-lg">
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -translate-y-6 sm:-translate-y-8 translate-x-6 sm:translate-x-8"></div>
      <CardContent className={isMobile ? 'p-4' : 'p-6'}>
        <div className={`
          grid gap-3 sm:gap-4 mb-4 sm:mb-6
          ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}
        `}>
          {/* Total Amount */}
          <div className={`
            text-center bg-blue-50 dark:bg-blue-950/30 rounded-xl 
            border border-blue-200 dark:border-blue-800
            ${isMobile ? 'p-3' : 'p-4'}
          `}>
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Total Amount</p>
            <p className={`
              font-bold text-blue-700 dark:text-blue-300
              ${isMobile ? 'text-lg' : 'text-xl'}
            `}>
              Rs. {totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Amount Paid */}
          <div className={`
            text-center bg-green-50 dark:bg-green-950/30 rounded-xl 
            border border-green-200 dark:border-green-800
            ${isMobile ? 'p-3' : 'p-4'}
          `}>
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Amount Paid</p>
            <p className={`
              font-bold text-green-700 dark:text-green-300
              ${isMobile ? 'text-lg' : 'text-xl'}
            `}>
              Rs. {totalPaid.toFixed(2)}
            </p>
          </div>

          {/* Remaining Balance */}
          <div className={`
            text-center bg-orange-50 dark:bg-orange-950/30 rounded-xl 
            border border-orange-200 dark:border-orange-800
            ${isMobile ? 'p-3' : 'p-4'}
          `}>
            <div className="flex items-center justify-center mb-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">Remaining</p>
            <p className={`
              font-bold text-orange-700 dark:text-orange-300
              ${isMobile ? 'text-lg' : 'text-xl'}
            `}>
              Rs. {remainingBalance.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`
              font-medium text-slate-600 dark:text-slate-400
              ${isMobile ? 'text-sm' : 'text-sm'}
            `}>
              Payment Progress
            </span>
            <span className={`
              font-bold text-slate-800 dark:text-slate-200
              ${isMobile ? 'text-sm' : 'text-sm'}
            `}>
              {paymentProgress.toFixed(1)}%
            </span>
          </div>
          <div className={`
            relative bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
            ${isMobile ? 'h-3' : 'h-3'}
          `}>
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${paymentProgress}%` }}
            ></div>
          </div>
        </div>
        
        {isFullyPaid && (
          <div className={`
            mt-4 bg-gradient-to-r from-green-500 to-emerald-500 
            rounded-xl text-white text-center
            ${isMobile ? 'p-3' : 'p-4'}
          `}>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className={`
                font-bold
                ${isMobile ? 'text-sm' : 'text-base'}
              `}>
                Bill Fully Settled!
              </span>
            </div>
            <p className={`
              opacity-90 mt-1
              ${isMobile ? 'text-xs' : 'text-sm'}
            `}>
              🎉 Payment completed successfully
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentSummary;
