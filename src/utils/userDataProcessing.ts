
import { UserTotal } from "@/types/user";

export const createUserMap = (usersData: any[], expenses: any[], payments: any[]) => {
  // Create a map of users for quick lookup
  const usersMap = new Map();
  usersData.forEach(user => {
    if (user?.user_name) {
      usersMap.set(user.user_name, user);
    }
  });

  // Group data by user with better error handling
  const userMap = new Map<string, UserTotal>();

  // Process expenses
  expenses.forEach(expense => {
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
  payments.forEach((payment: any) => {
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

  return userMap;
};

export const calculateUserStats = (userMap: Map<string, UserTotal>) => {
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

  // Calculate total stats
  const stats = {
    totalExpenses: usersArray.reduce((sum, user) => sum + user.total_amount, 0),
    totalPaid: usersArray.reduce((sum, user) => sum + user.total_paid, 0),
    totalOutstanding: usersArray.reduce((sum, user) => sum + user.remaining_balance, 0)
  };

  return { usersArray, stats };
};
