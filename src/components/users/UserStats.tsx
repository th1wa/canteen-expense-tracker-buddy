
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface UserStatsProps {
  totalUsers: number;
  originalUsersCount?: number;
  totalExpenses: number;
  totalPaid: number;
  totalOutstanding: number;
  hasActiveFilters: boolean;
}

const UserStats = ({
  totalUsers,
  originalUsersCount,
  totalExpenses,
  totalPaid,
  totalOutstanding,
  hasActiveFilters
}: UserStatsProps) => {
  return (
    <Card className="bg-blue-50">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-blue-600 font-medium">Total Users</p>
            <p className="text-lg font-bold text-blue-700">{totalUsers}</p>
            {hasActiveFilters && originalUsersCount && (
              <p className="text-xs text-blue-500">of {originalUsersCount}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-orange-600 font-medium">Total Expenses</p>
            <p className="text-lg font-bold text-orange-700">Rs. {totalExpenses.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium">Total Paid</p>
            <p className="text-lg font-bold text-green-700">Rs. {totalPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-red-600 font-medium">Total Outstanding</p>
            <p className="text-lg font-bold text-red-700">Rs. {totalOutstanding.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStats;
