
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
  const { toast } = useToast();

  const fetchSummaryData = async () => {
    if (!hasAccess) return;
    
    setLoading(true);
    try {
      const monthDate = new Date(selectedMonth + '-01');
      
      const { data, error } = await supabase.rpc('get_user_expense_summary', {
        selected_month: monthDate.toISOString().split('T')[0]
      });

      if (error) throw error;

      // Group data by user
      const userMap = new Map<string, UserSummary>();
      
      data?.forEach((record: ExpenseSummary) => {
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
        userSummary.total_expenses += parseFloat(record.expense_amount.toString());
        if (record.payment_made) {
          userSummary.total_paid += parseFloat(record.expense_amount.toString());
        }
        userSummary.total_remainder += parseFloat(record.remainder_amount.toString());
      });

      const summaryArray = Array.from(userMap.values());
      setSummaryData(summaryArray);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch summary data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [selectedMonth, hasAccess]);

  return { summaryData, loading };
};
