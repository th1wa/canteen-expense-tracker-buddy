
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
            <h3 className="font-semibold text-base sm:text-lg truncate">{user.user_name}</h3>
            {user.is_settled && (
              <Badge className="bg-green-600 text-xs sm:text-sm">Settled ✓</Badge>
            )}
          </div>
          {!user.is_settled && canManagePayments && (
            <Button
              size="sm"
              onClick={handlePaymentClick}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
              Pay
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Amount</p>
            <p className="text-sm sm:text-lg font-semibold flex items-center gap-1">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              Rs. {user.total_amount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Amount Paid</p>
            <p className="text-sm sm:text-lg font-semibold text-green-600">
              Rs. {user.total_paid.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Remaining Balance</p>
            <p className={`text-sm sm:text-lg font-semibold ${user.is_settled ? 'text-green-600' : 'text-orange-600'}`}>
              Rs. {user.remaining_balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs sm:text-sm">
            <span>Payment Progress</span>
            <span>{Math.min(user.payment_progress, 100).toFixed(1)}%</span>
          </div>
          <Progress value={Math.min(user.payment_progress, 100)} className="h-2" />
        </div>

        {user.payments.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              Recent Payments ({user.payments.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {user.payments.slice(0, 3).map((payment) => (
                <Badge key={payment.id} variant="secondary" className="text-xs">
                  Rs. {payment.amount.toFixed(2)}
                </Badge>
              ))}
              {user.payments.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.payments.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {!canManagePayments && !user.is_settled && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Contact admin or canteen staff to record payments
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserCard;
