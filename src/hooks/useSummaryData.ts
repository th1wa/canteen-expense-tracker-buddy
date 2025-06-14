import { useState, useEffect, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ExpenseSummary, UserSummary } from '@/types/summary';

export const useSummaryData = (selectedMonth: string, hasAccess: boolean) => {
  const [summaryData, setSummaryData] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!hasAccess) {
      setSummaryData([]);
      setLoading(false);
      setError(null);
      return;
    }

    if (!selectedMonth) {
      setError('Invalid month selected');
      return;
    }

    const fetchSummaryData = async () => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      try {
        setLoading(true);
        setError(null);

        const monthDate = new Date(selectedMonth + '-01');
        if (isNaN(monthDate.getTime())) {
          throw new Error('Invalid date format');
        }

        console.log('Fetching summary data for month:', selectedMonth);
        
        const { data, error: fetchError } = await supabase
          .rpc('get_user_expense_summary', { 
            selected_month: monthDate.toISOString().split('T')[0] 
          });

        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (fetchError) {
          console.error('Error fetching summary data:', fetchError);
          throw new Error(fetchError.message || 'Failed to fetch summary data');
        }

        if (!data) {
          console.warn('No summary data received');
          setSummaryData([]);
          return;
        }

        console.log('Raw summary data:', data);

        // Group by user and aggregate
        const userMap = new Map<string, UserSummary>();
        
        data.forEach((record: ExpenseSummary) => {
          if (!record?.user_name) {
            console.warn('Skipping record with invalid user_name:', record);
            return;
          }

          const userName = record.user_name;
          
          if (!userMap.has(userName)) {
            userMap.set(userName, {
              user_name: userName,
              total_expenses: 0,
              total_paid: 0,
              total_remainder: 0,
              daily_records: []
            });
          }
          
          const userSummary = userMap.get(userName)!;
          userSummary.daily_records.push(record);
          
          const expenseAmount = Number(record.expense_amount) || 0;
          const remainderAmount = Number(record.remainder_amount) || 0;
          const paidAmount = expenseAmount - remainderAmount;
          
          userSummary.total_expenses += expenseAmount;
          userSummary.total_paid += Math.max(0, paidAmount);
          userSummary.total_remainder += Math.max(0, remainderAmount);
        });

        const result = Array.from(userMap.values())
          .sort((a, b) => a.user_name.localeCompare(b.user_name));
        
        console.log('Processed summary data:', result);
        setSummaryData(result);
        
      } catch (err) {
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }
        
        console.error('Error in fetchSummaryData:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setSummaryData([]);
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchSummaryData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [selectedMonth, hasAccess]);

  return { summaryData, loading, error };
};
