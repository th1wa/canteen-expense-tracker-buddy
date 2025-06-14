
import { useState, useEffect, useRef, useCallback } from 'react';
import { UserTotal } from "@/types/user";
import { useAuth } from "@/contexts/AuthContext";
import { fetchExpenses, fetchUsers, fetchPayments } from "@/utils/supabaseQueries";
import { createUserMap, calculateUserStats } from "@/utils/userDataProcessing";

export const useUsersData = (refreshTrigger: number, hasAccess: boolean = true) => {
  const [users, setUsers] = useState<UserTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalStats, setTotalStats] = useState<{
    totalExpenses: number;
    totalPaid: number;
    totalOutstanding: number;
  } | null>(null);
  
  const { profile } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const fetchUsersWithPayments = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Reset error state
    setError(null);
    
    // Don't fetch if profile is not loaded yet
    if (profile === undefined) {
      setLoading(true);
      return;
    }

    // If profile is null (user not authenticated), set empty state
    if (profile === null) {
      if (isMountedRef.current) {
        setUsers([]);
        setLoading(false);
        setError('User not authenticated');
      }
      return;
    }

    // If user doesn't have access, return empty state
    if (!hasAccess) {
      if (isMountedRef.current) {
        setUsers([]);
        setTotalStats(null);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    
    try {
      // For basic users, only fetch their own data
      const isBasicUser = profile.role === 'user';
      
      // Fetch all data in parallel
      const [expensesResult, usersResult, paymentsResult] = await Promise.all([
        fetchExpenses(isBasicUser, profile.username, abortControllerRef.current.signal),
        fetchUsers(isBasicUser, profile.username, abortControllerRef.current.signal),
        fetchPayments(isBasicUser, profile.username, abortControllerRef.current.signal)
      ]);

      // Check for errors
      if (expensesResult.error) {
        if (expensesResult.error.name === 'AbortError') return;
        console.error('Expenses error:', expensesResult.error);
        throw new Error(`Failed to fetch expenses: ${expensesResult.error.message}`);
      }

      if (usersResult.error) {
        if (usersResult.error.name === 'AbortError') return;
        console.error('Users error:', usersResult.error);
        throw new Error(`Failed to fetch users: ${usersResult.error.message}`);
      }

      if (paymentsResult.error) {
        if (paymentsResult.error.name === 'AbortError') return;
        console.error('Payments error:', paymentsResult.error);
        throw new Error(`Failed to fetch payments: ${paymentsResult.error.message}`);
      }

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      // Safely handle null/undefined data
      const safeExpenses = Array.isArray(expensesResult.data) ? expensesResult.data : [];
      const safeUsersData = Array.isArray(usersResult.data) ? usersResult.data : [];
      const safePayments = Array.isArray(paymentsResult.data) ? paymentsResult.data : [];

      // Process data using utility functions
      const userMap = createUserMap(safeUsersData, safeExpenses, safePayments);
      const { usersArray, stats } = calculateUserStats(userMap);

      if (isMountedRef.current) {
        setUsers(usersArray);
        setTotalStats(stats);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      
      console.error('Error fetching users with payments:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching data';
      
      if (isMountedRef.current) {
        setError(errorMessage);
        setUsers([]);
        setTotalStats(null);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [profile, hasAccess]);

  useEffect(() => {
    fetchUsersWithPayments();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUsersWithPayments, refreshTrigger]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { users, loading, error, totalStats, refetch: fetchUsersWithPayments };
};
