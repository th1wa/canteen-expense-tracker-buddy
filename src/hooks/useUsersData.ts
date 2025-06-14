
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { UserTotal } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useUsersData = (refreshTrigger: number) => {
  const [users, setUsers] = useState<UserTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  const fetchUsersWithPayments = async () => {
    // Reset error state at the start of each fetch
    setError(null);
    
    // Don't fetch if profile is not loaded yet
    if (profile === undefined) {
      setLoading(true);
      return;
    }

    // If profile is null (user not authenticated), set empty state
    if (profile === null) {
      setUsers([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    
    try {
      // For basic users, only fetch their own data
      const isBasicUser = profile.role === 'user';
      
      // Fetch expenses with user filtering if needed
      const expensesQuery = supabase
        .from('expenses')
        .select('*')
        .order('user_name');
      
      if (isBasicUser && profile.username) {
        expensesQuery.eq('user_name', profile.username);
      }

      const { data: expenses, error: expensesError } = await expensesQuery;

      if (expensesError) {
        console.error('Expenses error:', expensesError);
        throw new Error(`Failed to fetch expenses: ${expensesError.message}`);
      }

      // Fetch users with similar filtering
      const usersQuery = supabase
        .from('users')
        .select('*')
        .order('user_name');
      
      if (isBasicUser && profile.username) {
        usersQuery.eq('user_name', profile.username);
      }

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        console.error('Users error:', usersError);
        throw new Error(`Failed to fetch users: ${usersError.message}`);
      }

      // Fetch payments with similar filtering
      const paymentsQuery = supabase
        .from('payments')
        .select('*')
        .order('user_name');
      
      if (isBasicUser && profile.username) {
        paymentsQuery.eq('user_name', profile.username);
      }

      const { data: payments, error: paymentsError } = await paymentsQuery;

      if (paymentsError) {
        console.error('Payments error:', paymentsError);
        throw new Error(`Failed to fetch payments: ${paymentsError.message}`);
      }

      // Safely handle null/undefined data
      const safeExpenses = Array.isArray(expenses) ? expenses : [];
      const safeUsersData = Array.isArray(usersData) ? usersData : [];
      const safePayments = Array.isArray(payments) ? payments : [];

      // Create a map of users for quick lookup
      const usersMap = new Map();
      safeUsersData.forEach(user => {
        if (user?.user_name) {
          usersMap.set(user.user_name, user);
        }
      });

      // Group data by user with better error handling
      const userMap = new Map<string, UserTotal>();

      // Process expenses
      safeExpenses.forEach(expense => {
        if (!expense?.user_name || expense.amount == null) {
          console.warn('Invalid expense data:', expense);
          return;
        }
        
        const userName = expense.user_name;
        const userDetails = usersMap.get(userName);
        
        if (!userMap.has(userName)) {
          userMap.set(userName, {
            user_name: userName,
            first_name: userDetails?.first_name || null,
            last_name: userDetails?.last_name || null,
            total_amount: 0,
            total_paid: 0,
            remaining_balance: 0,
            payment_progress: 0,
            is_settled: false,
            payments: []
          });
        }
        
        const user = userMap.get(userName)!;
        const amount = Number(expense.amount) || 0;
        user.total_amount += amount;
      });

      // Process payments
      safePayments.forEach((payment: any) => {
        if (!payment?.user_name || payment.amount == null) {
          console.warn('Invalid payment data:', payment);
          return;
        }
        
        const userName = payment.user_name;
        if (userMap.has(userName)) {
          const user = userMap.get(userName)!;
          const amount = Number(payment.amount) || 0;
          user.total_paid += amount;
          user.payments.push({
            id: payment.id || `payment-${Date.now()}-${Math.random()}`,
            amount: amount,
            payment_date: payment.payment_date || new Date().toISOString().split('T')[0],
            created_at: payment.created_at || new Date().toISOString()
          });
        }
      });

      // Calculate remaining balances and progress
      const usersArray = Array.from(userMap.values()).map(user => {
        user.remaining_balance = Math.max(0, user.total_amount - user.total_paid);
        user.payment_progress = user.total_amount > 0 ? Math.min((user.total_paid / user.total_amount) * 100, 100) : 0;
        user.is_settled = user.remaining_balance <= 0.01; // Allow for small rounding differences
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching data';
      setError(errorMessage);
      
      // Set empty array on error to prevent UI issues
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithPayments();
  }, [refreshTrigger, profile]);

  return { users, loading, error, refetch: fetchUsersWithPayments };
};
