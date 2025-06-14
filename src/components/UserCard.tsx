
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, DollarSign, CreditCard } from "lucide-react";
import { UserTotal } from "@/types/user";

interface UserCardProps {
  user: UserTotal;
  canManagePayments: boolean;
  onPaymentClick: (user: UserTotal) => void;
}

const UserCard = ({ user, canManagePayments, onPaymentClick }: UserCardProps) => {
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
    <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] w-full group animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      <CardContent className="card-responsive">
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 transition-colors group-hover:text-primary" />
            <h3 className="font-semibold text-sm sm:text-base md:text-lg truncate transition-colors group-hover:text-primary">{getDisplayName()}</h3>
            {user.is_settled && (
              <Badge className="bg-green-600 text-xs sm:text-sm flex-shrink-0 animate-in zoom-in-95 duration-300">Settled ✓</Badge>
            )}
          </div>
          {!user.is_settled && canManagePayments && (
            <Button
              size="sm"
              onClick={handlePaymentClick}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm btn-touch w-full sm:w-auto transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:rotate-12" />
              Pay
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3">
          <div className="space-y-1 transition-all duration-200 hover:scale-105">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
            <p className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-1 transition-colors">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 transition-transform hover:scale-110" />
              Rs. {user.total_amount.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1 transition-all duration-200 hover:scale-105">
            <p className="text-xs sm:text-sm text-muted-foreground">Amount Paid</p>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-green-600 transition-colors">
              Rs. {user.total_paid.toFixed(2)}
            </p>
          </div>
          <div className="space-y-1 sm:col-span-2 lg:col-span-1 transition-all duration-200 hover:scale-105">
            <p className="text-xs sm:text-sm text-muted-foreground">Remaining Balance</p>
            <p className={`text-sm sm:text-base md:text-lg font-semibold transition-colors ${user.is_settled ? 'text-green-600' : 'text-orange-600'}`}>
              Rs. {user.remaining_balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm transition-all duration-200">
            <span>Payment Progress</span>
            <span className="transition-all duration-300">{Math.min(user.payment_progress, 100).toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(user.payment_progress, 100)} className="h-2 sm:h-3 transition-all duration-500" />
        </div>

        {user.payments.length > 0 && (
          <div className="mt-3 pt-3 border-t transition-all duration-200">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 transition-colors">
              Recent Payments ({user.payments.length})
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {user.payments.slice(0, 3).map((payment, index) => (
                <Badge 
                  key={payment.id} 
                  variant="secondary" 
                  className="text-xs transition-all duration-200 hover:scale-110 animate-in fade-in-0 zoom-in-95"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  Rs. {payment.amount.toFixed(2)}
                </Badge>
              ))}
              {user.payments.length > 3 && (
                <Badge variant="outline" className="text-xs transition-all duration-200 hover:scale-110">
                  +{user.payments.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {!canManagePayments && !user.is_settled && (
          <div className="mt-3 pt-3 border-t animate-in fade-in duration-300">
            <p className="text-xs sm:text-sm text-muted-foreground transition-colors">
              Contact admin or canteen staff to record payments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserCard;
