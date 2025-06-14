
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign } from "lucide-react";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">Rs. {totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold">Rs. {totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Remaining</p>
              <p className="text-2xl font-bold">Rs. {totalRemaining.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCards;
