
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExpenseSummary {
  user_name: string;
  expense_date: string;
  expense_amount: number;
  payment_made: boolean;
  payment_date: string | null;
  remainder_amount: number;
}

interface UserSummary {
  user_name: string;
  total_expenses: number;
  total_paid: number;
  total_remainder: number;
  daily_records: ExpenseSummary[];
}

export const useSummaryData = (selectedMonth: string, hasAccess: boolean) => {
  const [summaryData, setSummaryData] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSummaryData = async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Validate selectedMonth format
      if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
        throw new Error('Invalid month format');
      }

      const monthDate = new Date(selectedMonth + '-01');
      
      // Validate date
      if (isNaN(monthDate.getTime())) {
        throw new Error('Invalid date');
      }
      
      const { data, error: rpcError } = await supabase.rpc('get_user_expense_summary', {
        selected_month: monthDate.toISOString().split('T')[0]
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message || 'Failed to fetch summary data');
      }

      if (!data) {
        setSummaryData([]);
        return;
      }

      // Group data by user with better error handling
      const userMap = new Map<string, UserSummary>();
      
      data.forEach((record: ExpenseSummary) => {
        if (!record?.user_name) {
          console.warn('Record missing user_name:', record);
          return;
        }
        
        if (!userMap.has(record.user_name)) {
          userMap.set(record.user_name, {
            user_name: record.user_name,
            total_expenses: 0,
            total_paid: 0,
            total_remainder: 0,
            daily_records: []
          });
        }
        
        const userSummary = userMap.get(record.user_name)!;
        userSummary.daily_records.push(record);
        
        const expenseAmount = Number(record.expense_amount) || 0;
        const remainderAmount = Number(record.remainder_amount) || 0;
        
        userSummary.total_expenses += expenseAmount;
        if (record.payment_made) {
          userSummary.total_paid += expenseAmount;
        }
        userSummary.total_remainder += remainderAmount;
      });

      const summaryArray = Array.from(userMap.values());
      setSummaryData(summaryArray);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: `Failed to fetch summary data: ${errorMessage}`,
        variant: "destructive"
      });
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [selectedMonth, hasAccess]);

  return { summaryData, loading, error, refetch: fetchSummaryData };
};
