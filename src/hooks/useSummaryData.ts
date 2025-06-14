
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
    // Reset error state
    setError(null);
    
    if (!hasAccess) {
      setLoading(false);
      setSummaryData([]);
      return;
    }
    
    setLoading(true);
    
    try {
      // Validate selectedMonth format
      if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth)) {
        throw new Error('Invalid month format. Expected YYYY-MM');
      }

      const monthDate = new Date(selectedMonth + '-01');
      
      // Validate date
      if (isNaN(monthDate.getTime())) {
        throw new Error('Invalid date provided');
      }
      
      const { data, error: rpcError } = await supabase.rpc('get_user_expense_summary', {
        selected_month: monthDate.toISOString().split('T')[0]
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(`Database error: ${rpcError.message}`);
      }

      // Handle null or undefined data
      if (!data || !Array.isArray(data)) {
        console.warn('No data returned from summary function');
        setSummaryData([]);
        return;
      }

      // Group data by user with better error handling
      const userMap = new Map<string, UserSummary>();
      
      data.forEach((record: any) => {
        if (!record || typeof record !== 'object' || !record.user_name) {
          console.warn('Invalid record in summary data:', record);
          return;
        }
        
        // Type-safe record processing
        const typedRecord: ExpenseSummary = {
          user_name: record.user_name,
          expense_date: record.expense_date || '',
          expense_amount: Number(record.expense_amount) || 0,
          payment_made: Boolean(record.payment_made),
          payment_date: record.payment_date || null,
          remainder_amount: Number(record.remainder_amount) || 0
        };
        
        if (!userMap.has(typedRecord.user_name)) {
          userMap.set(typedRecord.user_name, {
            user_name: typedRecord.user_name,
            total_expenses: 0,
            total_paid: 0,
            total_remainder: 0,
            daily_records: []
          });
        }
        
        const userSummary = userMap.get(typedRecord.user_name)!;
        userSummary.daily_records.push(typedRecord);
        
        userSummary.total_expenses += typedRecord.expense_amount;
        if (typedRecord.payment_made) {
          userSummary.total_paid += typedRecord.expense_amount;
        }
        userSummary.total_remainder += typedRecord.remainder_amount;
      });

      const summaryArray = Array.from(userMap.values()).sort((a, b) => 
        a.user_name.localeCompare(b.user_name)
      );
      
      setSummaryData(summaryArray);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching summary';
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
