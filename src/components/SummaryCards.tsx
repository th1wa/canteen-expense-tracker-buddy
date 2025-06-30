
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SummaryCardsProps {
  totalUsers: number;
  totalExpenses: number;
  totalPaid: number;
  totalRemaining: number;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalUsers,
  totalExpenses,
  totalPaid,
  totalRemaining
}) => {
  const isMobile = useIsMobile();

  // Ensure all values are valid numbers
  const safeTotalUsers = Number(totalUsers) || 0;
  const safeTotalExpenses = Number(totalExpenses) || 0;
  const safeTotalPaid = Number(totalPaid) || 0;
  const safeTotalRemaining = Number(totalRemaining) || 0;

  const formatAmount = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(2);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                <span className="hidden sm:inline">Total Users</span>
                <span className="sm:hidden">Users</span>
              </p>
              <p className="font-bold text-blue-700 dark:text-blue-300 truncate text-sm sm:text-lg md:text-xl">
                {safeTotalUsers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">
                <span className="hidden sm:inline">Total Expenses</span>
                <span className="sm:hidden">Expenses</span>
              </p>
              <p className="font-bold text-orange-700 dark:text-orange-300 truncate text-xs sm:text-sm md:text-lg">
                <span className="hidden sm:inline">Rs. </span>₹{formatAmount(safeTotalExpenses)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">
                <span className="hidden sm:inline">Total Paid</span>
                <span className="sm:hidden">Paid</span>
              </p>
              <p className="font-bold text-green-700 dark:text-green-300 truncate text-xs sm:text-sm md:text-lg">
                <span className="hidden sm:inline">Rs. </span>₹{formatAmount(safeTotalPaid)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">
                <span className="hidden sm:inline">Total Remaining</span>
                <span className="sm:hidden">Remaining</span>
              </p>
              <p className="font-bold text-red-700 dark:text-red-300 truncate text-xs sm:text-sm md:text-lg">
                <span className="hidden sm:inline">Rs. </span>₹{formatAmount(safeTotalRemaining)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
