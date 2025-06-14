
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, DollarSign, CreditCard } from "lucide-react";
import { UserTotal } from "@/types/user";
import { useIsMobile } from "@/hooks/use-mobile";

interface UserCardProps {
  user: UserTotal;
  canManagePayments: boolean;
  onPaymentClick: (user: UserTotal) => void;
}

const UserCard = ({ user, canManagePayments, onPaymentClick }: UserCardProps) => {
  const isMobile = useIsMobile();

  const handlePaymentClick = () => {
    if (!canManagePayments) {
      return;
    }
    onPaymentClick(user);
  };

  const getDisplayName = () => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return fullName ? `${user.user_name} (${fullName})` : user.user_name;
  };

  return (
    <Card className={`
      hover:shadow-lg transition-all duration-300 hover:scale-[1.02] w-full group 
      animate-in fade-in-0 slide-in-from-bottom-4 duration-500
      ${isMobile ? 'active:scale-[0.98]' : ''}
      touch-manipulation
    `}>
      <CardContent className={`
        ${isMobile ? 'p-4' : 'p-4 sm:p-6'} 
        space-y-3 sm:space-y-4
      `}>
        {/* Header Section */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 transition-colors group-hover:text-primary" />
            <h3 className={`
              font-semibold transition-colors group-hover:text-primary
              ${isMobile ? 'text-sm leading-tight' : 'text-sm sm:text-base md:text-lg'}
              truncate
            `}>
              {getDisplayName()}
            </h3>
            {user.is_settled && (
              <Badge className={`
                bg-green-600 flex-shrink-0 animate-in zoom-in-95 duration-300
                ${isMobile ? 'text-xs px-2 py-1' : 'text-xs sm:text-sm'}
              `}>
                Settled ✓
              </Badge>
            )}
          </div>
          
          {!user.is_settled && canManagePayments && (
            <Button
              size={isMobile ? "sm" : "sm"}
              onClick={handlePaymentClick}
              className={`
                flex items-center gap-1 sm:gap-2 transition-all duration-200 
                hover:scale-105 hover:shadow-md active:scale-95 touch-manipulation
                ${isMobile 
                  ? 'w-full min-h-[44px] text-sm' 
                  : 'text-xs sm:text-sm w-full sm:w-auto'
                }
              `}
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:rotate-12" />
              Pay
            </Button>
          )}
        </div>

        {/* Amount Grid */}
        <div className={`
          grid gap-3 sm:gap-4 mb-3
          ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}
        `}>
          <div className="space-y-1 transition-all duration-200 hover:scale-105 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
            <p className={`
              font-semibold flex items-center gap-1 transition-colors
              ${isMobile ? 'text-base' : 'text-sm sm:text-base md:text-lg'}
            `}>
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 transition-transform hover:scale-110" />
              Rs. {user.total_amount.toFixed(2)}
            </p>
          </div>
          
          <div className="space-y-1 transition-all duration-200 hover:scale-105 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground">Amount Paid</p>
            <p className={`
              font-semibold text-green-600 transition-colors
              ${isMobile ? 'text-base' : 'text-sm sm:text-base md:text-lg'}
            `}>
              Rs. {user.total_paid.toFixed(2)}
            </p>
          </div>
          
          <div className={`
            space-y-1 transition-all duration-200 hover:scale-105 
            bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg
            ${isMobile ? '' : 'sm:col-span-2 lg:col-span-1'}
          `}>
            <p className="text-xs sm:text-sm text-muted-foreground">Remaining Balance</p>
            <p className={`
              font-semibold transition-colors 
              ${user.is_settled ? 'text-green-600' : 'text-orange-600'}
              ${isMobile ? 'text-base' : 'text-sm sm:text-base md:text-lg'}
            `}>
              Rs. {user.remaining_balance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm transition-all duration-200">
            <span>Payment Progress</span>
            <span className="transition-all duration-300 font-medium">
              {Math.min(user.payment_progress, 100).toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(user.payment_progress, 100)} 
            className={`transition-all duration-500 ${isMobile ? 'h-3' : 'h-2 sm:h-3'}`}
          />
        </div>

        {/* Payments Section */}
        {user.payments.length > 0 && (
          <div className="mt-3 pt-3 border-t transition-all duration-200">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 transition-colors">
              Recent Payments ({user.payments.length})
            </p>
            <div className={`
              flex flex-wrap gap-1 sm:gap-2
              ${isMobile ? 'gap-2' : ''}
            `}>
              {user.payments.slice(0, isMobile ? 2 : 3).map((payment, index) => (
                <Badge 
                  key={payment.id} 
                  variant="secondary" 
                  className={`
                    transition-all duration-200 hover:scale-110 animate-in fade-in-0 zoom-in-95
                    ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  Rs. {payment.amount.toFixed(2)}
                </Badge>
              ))}
              {user.payments.length > (isMobile ? 2 : 3) && (
                <Badge variant="outline" className={`
                  transition-all duration-200 hover:scale-110
                  ${isMobile ? 'text-xs px-2 py-1' : 'text-xs'}
                `}>
                  +{user.payments.length - (isMobile ? 2 : 3)} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Access Message */}
        {!canManagePayments && !user.is_settled && (
          <div className="mt-3 pt-3 border-t animate-in fade-in duration-300">
            <p className={`
              text-muted-foreground transition-colors
              ${isMobile ? 'text-xs leading-relaxed' : 'text-xs sm:text-sm'}
            `}>
              Contact admin or canteen staff to record payments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserCard;
