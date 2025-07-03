
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useExportData = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExportSummary = async (selectedMonth: string) => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Invoking excel-export function with:', {
        type: 'summary',
        selectedMonth: selectedMonth
      });

      const response = await fetch(`https://wshugmfkkbpwpxfakqgk.supabase.co/functions/v1/excel-export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'summary',
          selectedMonth: selectedMonth
        })
      });

      console.log('Excel export response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Function error response:', errorText);
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      const csvContent = await response.text();
      console.log('CSV content received, length:', csvContent.length);

      if (!csvContent || csvContent.trim() === '') {
        throw new Error('No data received from export function');
      }

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detailed_canteen_summary_report_${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Detailed summary report with comprehensive expense breakdown has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to generate detailed summary report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportUserDetail = async (userName: string, selectedMonth: string) => {
    if (!userName) {
      toast({
        title: "Access Denied",
        description: "Please select a user for detailed expense report.",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`https://wshugmfkkbpwpxfakqgk.supabase.co/functions/v1/excel-export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'user-detail',
          userName: userName,
          selectedMonth: selectedMonth
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      const csvContent = await response.text();

      if (!csvContent || csvContent.trim() === '') {
        throw new Error('No data received from export function');
      }

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `detailed_user_expense_report_${userName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `Comprehensive expense report for ${userName} with detailed breakdown has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : `Failed to generate detailed report for ${userName}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return {
    isExporting,
    handleExportSummary,
    handleExportUserDetail
  };
};
