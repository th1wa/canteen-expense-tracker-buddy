
import { useMemo } from 'react';
import { UserSummary } from '@/types/summary';

export const useSummaryCalculations = (filteredData: UserSummary[]) => {
  const grandTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, user) => {
        if (!user) return acc;
        
        return {
          totalUsers: acc.totalUsers + 1,
          totalExpenses: acc.totalExpenses + (Number(user.total_expenses) || 0),
          totalPaid: acc.totalPaid + (Number(user.total_paid) || 0),
          totalRemaining: acc.totalRemaining + (Number(user.total_remainder) || 0)
        };
      },
      { totalUsers: 0, totalExpenses: 0, totalPaid: 0, totalRemaining: 0 }
    );
  }, [filteredData]);

  return { grandTotals };
};
