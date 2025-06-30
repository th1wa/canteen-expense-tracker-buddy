
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PDFReportsProps {
  refreshTrigger: number;
}

const PDFReports = ({ refreshTrigger }: PDFReportsProps) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generateExpenseReport = async () => {
    setGenerating(true);
    try {
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Expense Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);
      doc.text(`Total Records: ${expenses?.length || 0}`, 20, 40);

      if (expenses && expenses.length > 0) {
        // Calculate totals
        const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
        doc.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 20, 50);

        // Table
        const tableData = expenses.map(exp => [
          exp.user_name,
          `Rs. ${parseFloat(exp.amount.toString()).toFixed(2)}`,
          exp.expense_date,
          exp.description || 'N/A'
        ]);

        doc.autoTable({
          head: [['User Name', 'Amount', 'Date', 'Description']],
          body: tableData,
          startY: 60,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [41, 128, 185] }
        });
      }

      doc.save(`expense-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Expense report downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generatePaymentReport = async () => {
    setGenerating(true);
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (error) throw error;

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Payment Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);
      doc.text(`Total Records: ${payments?.length || 0}`, 20, 40);

      if (payments && payments.length > 0) {
        // Calculate totals
        const totalAmount = payments.reduce((sum, pay) => sum + parseFloat(pay.amount.toString()), 0);
        doc.text(`Total Payments: Rs. ${totalAmount.toFixed(2)}`, 20, 50);

        // Table
        const tableData = payments.map(pay => [
          pay.user_name,
          `Rs. ${parseFloat(pay.amount.toString()).toFixed(2)}`,
          pay.payment_date,
          pay.payment_method || 'N/A'
        ]);

        doc.autoTable({
          head: [['User Name', 'Amount', 'Date', 'Method']],
          body: tableData,
          startY: 60,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [46, 204, 113] }
        });
      }

      doc.save(`payment-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Payment report downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateSummaryReport = async () => {
    setGenerating(true);
    try {
      const [expensesResult, paymentsResult, usersResult] = await Promise.all([
        supabase.from('expenses').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('users').select('*')
      ]);

      if (expensesResult.error || paymentsResult.error || usersResult.error) {
        throw new Error('Failed to fetch data');
      }

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text('Summary Report', 20, 20);
      doc.setFontSize(12);
      doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 20, 30);

      const expenses = expensesResult.data || [];
      const payments = paymentsResult.data || [];
      const users = usersResult.data || [];

      const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
      const totalPayments = payments.reduce((sum, pay) => sum + parseFloat(pay.amount.toString()), 0);
      const outstanding = totalExpenses - totalPayments;

      // Summary stats
      doc.text(`Total Users: ${users.length}`, 20, 50);
      doc.text(`Total Expenses: Rs. ${totalExpenses.toFixed(2)}`, 20, 60);
      doc.text(`Total Payments: Rs. ${totalPayments.toFixed(2)}`, 20, 70);
      doc.text(`Outstanding: Rs. ${outstanding.toFixed(2)}`, 20, 80);

      // User summary table
      const userStats: { [key: string]: { expenses: number; payments: number } } = {};
      
      expenses.forEach(exp => {
        if (!userStats[exp.user_name]) {
          userStats[exp.user_name] = { expenses: 0, payments: 0 };
        }
        userStats[exp.user_name].expenses += parseFloat(exp.amount.toString());
      });

      payments.forEach(pay => {
        if (!userStats[pay.user_name]) {
          userStats[pay.user_name] = { expenses: 0, payments: 0 };
        }
        userStats[pay.user_name].payments += parseFloat(pay.amount.toString());
      });

      const summaryData = Object.entries(userStats).map(([user, stats]) => [
        user,
        `Rs. ${stats.expenses.toFixed(2)}`,
        `Rs. ${stats.payments.toFixed(2)}`,
        `Rs. ${(stats.expenses - stats.payments).toFixed(2)}`
      ]);

      doc.autoTable({
        head: [['User Name', 'Total Expenses', 'Total Payments', 'Outstanding']],
        body: summaryData,
        startY: 90,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [155, 89, 182] }
      });

      doc.save(`summary-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: "PDF Generated",
        description: "Summary report downloaded successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4" />
          PDF Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button 
            onClick={generateExpenseReport}
            disabled={generating}
            size="sm"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Expense Report
          </Button>
          
          <Button 
            onClick={generatePaymentReport}
            disabled={generating}
            size="sm"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Payment Report
          </Button>
          
          <Button 
            onClick={generateSummaryReport}
            disabled={generating}
            size="sm"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Summary Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFReports;
