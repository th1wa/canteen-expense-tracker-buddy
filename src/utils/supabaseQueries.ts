
import { supabase } from "@/integrations/supabase/client";

export const fetchExpenses = async (isBasicUser: boolean, username?: string, signal?: AbortSignal) => {
  const expensesQuery = supabase
    .from('expenses')
    .select('*')
    .order('user_name')
    .abortSignal(signal);
  
  if (isBasicUser && username) {
    expensesQuery.eq('user_name', username);
  }

  return await expensesQuery;
};

export const fetchUsers = async (isBasicUser: boolean, username?: string, signal?: AbortSignal) => {
  const usersQuery = supabase
    .from('users')
    .select('*')
    .order('user_name')
    .abortSignal(signal);
  
  if (isBasicUser && username) {
    usersQuery.eq('user_name', username);
  }

  return await usersQuery;
};

export const fetchPayments = async (isBasicUser: boolean, username?: string, signal?: AbortSignal) => {
  const paymentsQuery = supabase
    .from('payments')
    .select('*')
    .order('user_name')
    .abortSignal(signal);
  
  if (isBasicUser && username) {
    paymentsQuery.eq('user_name', username);
  }

  return await paymentsQuery;
};
