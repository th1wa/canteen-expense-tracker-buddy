
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

  return (
    <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardContent className="spacing-responsive-sm">
          <div className="flex items-center gap-2">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0`}>
              <Users className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-white`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">Total Users</p>
              <p className={`font-bold text-blue-700 dark:text-blue-300 truncate ${isMobile ? 'text-lg' : 'text-lg sm:text-xl'}`}>
                {totalUsers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardContent className="spacing-responsive-sm">
          <div className="flex items-center gap-2">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0`}>
              <TrendingUp className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-white`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">Total Expenses</p>
              <p className={`font-bold text-orange-700 dark:text-orange-300 truncate ${isMobile ? 'text-sm' : 'text-sm sm:text-lg'}`}>
                Rs. {totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardContent className="spacing-responsive-sm">
          <div className="flex items-center gap-2">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0`}>
              <DollarSign className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-white`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">Total Paid</p>
              <p className={`font-bold text-green-700 dark:text-green-300 truncate ${isMobile ? 'text-sm' : 'text-sm sm:text-lg'}`}>
                Rs. {totalPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
        <CardContent className="spacing-responsive-sm">
          <div className="flex items-center gap-2">
            <div className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8 sm:w-10 sm:h-10'} bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0`}>
              <AlertCircle className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4 sm:w-5 sm:h-5'} text-white`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">Total Remaining</p>
              <p className={`font-bold text-red-700 dark:text-red-300 truncate ${isMobile ? 'text-sm' : 'text-sm sm:text-lg'}`}>
                Rs. {totalRemaining.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
