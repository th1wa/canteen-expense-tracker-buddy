
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserTotal } from "@/types/user";

export const useUsersData = (refreshTrigger: number) => {
  const [users, setUsers] = useState<UserTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsersWithPayments = async () => {
    setLoading(true);
    try {
      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('user_name');

      if (expensesError) throw expensesError;

      // Fetch payments using type assertion
      const { data: payments, error: paymentsError } = await supabase
        .from('payments' as any)
        .select('*')
        .order('user_name');

      if (paymentsError) throw paymentsError;

      // Group data by user
      const userMap = new Map<string, UserTotal>();

      // Process expenses
      expenses?.forEach(expense => {
        const userName = expense.user_name;
        if (!userMap.has(userName)) {
          userMap.set(userName, {
            user_name: userName,
            total_amount: 0,
            total_paid: 0,
            remaining_balance: 0,
            payment_progress: 0,
            is_settled: false,
            payments: []
          });
        }
        const user = userMap.get(userName)!;
        user.total_amount += parseFloat(expense.amount.toString());
      });

      // Process payments
      payments?.forEach((payment: any) => {
        const userName = payment.user_name;
        if (userMap.has(userName)) {
          const user = userMap.get(userName)!;
          user.total_paid += parseFloat(payment.amount.toString());
          user.payments.push({
            id: payment.id,
            amount: parseFloat(payment.amount.toString()),
            payment_date: payment.payment_date,
            created_at: payment.created_at
          });
        }
      });

      // Calculate remaining balances and progress
      const usersArray = Array.from(userMap.values()).map(user => {
        user.remaining_balance = Math.max(0, user.total_amount - user.total_paid);
        user.payment_progress = user.total_amount > 0 ? (user.total_paid / user.total_amount) * 100 : 0;
        user.is_settled = user.remaining_balance <= 0;
        user.payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return user;
      });

      // Sort by remaining balance (highest first), then by name
      usersArray.sort((a, b) => {
        if (a.is_settled !== b.is_settled) {
          return a.is_settled ? 1 : -1; // Settled users at the bottom
        }
        return b.remaining_balance - a.remaining_balance;
      });

      setUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users with payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithPayments();
  }, [refreshTrigger]);

  return { users, loading, refetch: fetchUsersWithPayments };
};
