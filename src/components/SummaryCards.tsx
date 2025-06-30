
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, CreditCard, AlertCircle, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SummaryCardsProps {
  totalUsers: number;
  totalExpenses: number;
  totalPaid: number;
  totalRemaining: number;
  selectedMonth: string;
}

const SummaryCards = ({ 
  totalUsers, 
  totalExpenses, 
  totalPaid, 
  totalRemaining, 
  selectedMonth 
}: SummaryCardsProps) => {
  const isMobile = useIsMobile();
  
  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toFixed(2)}`;
  };

  const getMonthName = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const paymentPercentage = totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0;

  const cards = [
    {
      title: "Total Users",
      value: totalUsers.toString(),
      icon: Users,
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      title: "Total Expenses",
      value: formatCurrency(totalExpenses),
      icon: DollarSign,
      color: "bg-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      title: "Total Paid",
      value: formatCurrency(totalPaid),
      icon: CreditCard,
      color: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      title: "Outstanding",
      value: formatCurrency(totalRemaining),
      icon: AlertCircle,
      color: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800"
    }
  ];

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-indigo-900 dark:text-indigo-100`}>
              {getMonthName(selectedMonth)}
            </h3>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Payment Rate: {paymentPercentage.toFixed(1)}%
            </Badge>
            <Badge 
              variant={totalRemaining > 0 ? "destructive" : "default"}
              className="text-xs"
            >
              {totalRemaining > 0 ? "Pending Payments" : "All Settled"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {cards.map((card, index) => (
          <Card key={index} className={`${card.bgColor} ${card.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
            <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600 dark:text-gray-300 mb-1 truncate`}>
                    {card.title}
                  </p>
                  <p className={`${isMobile ? 'text-lg' : 'text-xl lg:text-2xl'} font-bold text-gray-900 dark:text-white truncate`}>
                    {card.value}
                  </p>
                </div>
                <div className={`${card.color} p-2 rounded-full flex-shrink-0`}>
                  <card.icon className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-white`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      <Card className="bg-white dark:bg-gray-800 shadow-sm">
        <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-700 dark:text-gray-300`}>
              Payment Progress
            </span>
            <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900 dark:text-white`}>
              {paymentPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, paymentPercentage))}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Paid: {formatCurrency(totalPaid)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Total: {formatCurrency(totalExpenses)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
