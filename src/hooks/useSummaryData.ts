
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
      // Enhanced validation of selectedMonth format
      if (!selectedMonth || typeof selectedMonth !== 'string') {
        throw new Error('Month selection is required');
      }

      if (!/^\d{4}-\d{2}$/.test(selectedMonth)) {
        throw new Error('Invalid month format. Expected YYYY-MM');
      }

      const monthDate = new Date(selectedMonth + '-01');
      
      // Enhanced date validation
      if (isNaN(monthDate.getTime())) {
        throw new Error('Invalid date provided');
      }

      // Check if date is too far in the future (sanity check)
      const currentDate = new Date();
      const maxDate = new Date(currentDate.getFullYear() + 1, 11, 31); // 1 year in future
      if (monthDate > maxDate) {
        throw new Error('Selected month is too far in the future');
      }
      
      console.log(`Fetching summary data for month: ${selectedMonth}`);
      
      const { data, error: rpcError } = await supabase.rpc('get_user_expense_summary', {
        selected_month: monthDate.toISOString().split('T')[0]
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(`Database error: ${rpcError.message}`);
      }

      // Enhanced data validation
      if (data === null || data === undefined) {
        console.warn('No data returned from summary function');
        setSummaryData([]);
        return;
      }

      if (!Array.isArray(data)) {
        console.error('Invalid data format returned from summary function:', typeof data);
        throw new Error('Invalid data format received from database');
      }

      // Group data by user with enhanced error handling
      const userMap = new Map<string, UserSummary>();
      
      data.forEach((record: any, index: number) => {
        try {
          if (!record || typeof record !== 'object') {
            console.warn(`Invalid record at index ${index}:`, record);
            return;
          }
          
          if (!record.user_name || typeof record.user_name !== 'string') {
            console.warn(`Invalid user_name at index ${index}:`, record.user_name);
            return;
          }
          
          // Enhanced type-safe record processing
          const typedRecord: ExpenseSummary = {
            user_name: String(record.user_name).trim(),
            expense_date: record.expense_date ? String(record.expense_date) : '',
            expense_amount: Number(record.expense_amount) || 0,
            payment_made: Boolean(record.payment_made),
            payment_date: record.payment_date ? String(record.payment_date) : null,
            remainder_amount: Number(record.remainder_amount) || 0
          };
          
          // Validate expense_amount is not negative
          if (typedRecord.expense_amount < 0) {
            console.warn(`Negative expense amount for user ${typedRecord.user_name}:`, typedRecord.expense_amount);
            typedRecord.expense_amount = 0;
          }
          
          if (!typedRecord.user_name) return;
          
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
        } catch (recordError) {
          console.error(`Error processing record at index ${index}:`, recordError, record);
        }
      });

      const summaryArray = Array.from(userMap.values())
        .map(user => ({
          ...user,
          // Ensure all totals are properly rounded to avoid floating point issues
          total_expenses: Math.round(user.total_expenses * 100) / 100,
          total_paid: Math.round(user.total_paid * 100) / 100,
          total_remainder: Math.round(user.total_remainder * 100) / 100
        }))
        .sort((a, b) => a.user_name.localeCompare(b.user_name));
      
      console.log(`Successfully processed ${summaryArray.length} users with ${data.length} total records`);
      setSummaryData(summaryArray);
      
    } catch (error) {
      console.error('Error fetching summary data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while fetching summary';
      setError(errorMessage);
      
      // Show toast for user feedback
      toast({
        title: "Error",
        description: errorMessage,
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
