
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportData {
  id: string;
  user_name: string;
  amount: number;
  date: string;
  note?: string;
  type: 'expense' | 'payment';
}

export const useBasicUserExport = (username: string) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToExcel = async (data: ExportData[], type: 'expenses' | 'payments') => {
    setIsExporting(true);
    try {
      if (data.length === 0) {
        toast({
          title: "No Data",
          description: `No ${type} to export`,
          variant: "destructive",
        });
        return;
      }

      // Enhanced headers with more details
      const headers = type === 'expenses' 
        ? ['Date', 'Amount (LKR)', 'Note/Description', 'Day of Week', 'Week Number', 'Running Total (LKR)', 'Category'] 
        : ['Date', 'Amount (LKR)', 'Day of Week', 'Week Number', 'Running Total (LKR)', 'Payment Method'];
      
      let runningTotal = 0;
      const csvData = data.map((item, index) => {
        const itemDate = new Date(item.date);
        const dayOfWeek = itemDate.toLocaleDateString('en-US', { weekday: 'long' });
        const weekNumber = Math.ceil(itemDate.getDate() / 7);
        runningTotal += item.amount;
        
        const category = type === 'expenses' ? 
          (item.amount > 500 ? 'Large Expense' : 
           item.amount > 200 ? 'Medium Expense' : 'Small Expense') : 
          (item.amount > 1000 ? 'Bank Transfer' : 
           item.amount > 500 ? 'Card Payment' : 'Cash Payment');
        
        return type === 'expenses'
          ? [
              format(itemDate, 'yyyy-MM-dd'),
              item.amount.toFixed(2),
              item.note || 'No description provided',
              dayOfWeek,
              `Week ${weekNumber}`,
              runningTotal.toFixed(2),
              category
            ]
          : [
              format(itemDate, 'yyyy-MM-dd'),
              item.amount.toFixed(2),
              dayOfWeek,
              `Week ${weekNumber}`,
              runningTotal.toFixed(2),
              category
            ];
      });

      // Add summary statistics
      const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
      const averageAmount = totalAmount / data.length;
      const maxAmount = Math.max(...data.map(item => item.amount));
      const minAmount = Math.min(...data.map(item => item.amount));
      const uniqueDays = new Set(data.map(item => format(new Date(item.date), 'yyyy-MM-dd'))).size;

      const summaryRows = [
        [],
        ['=== DETAILED SUMMARY STATISTICS ==='],
        [`Total ${type}:`, `LKR ${totalAmount.toFixed(2)}`],
        [`Average per transaction:`, `LKR ${averageAmount.toFixed(2)}`],
        [`Highest single amount:`, `LKR ${maxAmount.toFixed(2)}`],
        [`Lowest single amount:`, `LKR ${minAmount.toFixed(2)}`],
        [`Total transactions:`, data.length.toString()],
        [`Days with activity:`, uniqueDays.toString()],
        [`Average per day:`, `LKR ${(totalAmount / uniqueDays).toFixed(2)}`],
        [],
        ['=== SPENDING PATTERN ANALYSIS ==='],
        [`Spending Category:`, totalAmount > 5000 ? 'High Spender' : totalAmount > 2000 ? 'Medium Spender' : 'Light Spender'],
        [`Transaction Frequency:`, data.length > 20 ? 'Very Active' : data.length > 10 ? 'Moderately Active' : 'Light Activity'],
        [`Average Transaction Size:`, averageAmount > 300 ? 'Large Transactions' : averageAmount > 150 ? 'Medium Transactions' : 'Small Transactions']
      ];

      const allData = [
        [`DETAILED ${type.toUpperCase()} REPORT FOR ${username.toUpperCase()}`],
        [`Generated on: ${format(new Date(), 'PPP pp')}`],
        [`Report Period: ${format(new Date(data[0]?.date || new Date()), 'MMM yyyy')}`],
        [],
        headers,
        ...csvData,
        ...summaryRows
      ];

      const csvContent = allData
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `detailed_my_${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Your detailed ${type} report with comprehensive analysis has been exported to Excel`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export detailed ${type} report`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async (data: ExportData[], type: 'expenses' | 'payments') => {
    setIsExporting(true);
    try {
      if (data.length === 0) {
        toast({
          title: "No Data",
          description: `No ${type} to export`,
          variant: "destructive",
        });
        return;
      }

      const pdf = new jsPDF();
      
      // Enhanced header with more details
      pdf.setFontSize(20);
      pdf.text(`Detailed ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 20, 20);
      
      // User and report information
      pdf.setFontSize(12);
      pdf.text(`User: ${username}`, 20, 35);
      pdf.text(`Generated: ${format(new Date(), 'PPP pp')}`, 20, 45);
      pdf.text(`Report Period: ${format(new Date(data[0]?.date || new Date()), 'MMMM yyyy')}`, 20, 55);
      pdf.text(`Total Records: ${data.length}`, 20, 65);

      // Calculate comprehensive statistics
      const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
      const averageAmount = totalAmount / data.length;
      const maxAmount = Math.max(...data.map(item => item.amount));
      const minAmount = Math.min(...data.map(item => item.amount));
      const uniqueDays = new Set(data.map(item => format(new Date(item.date), 'yyyy-MM-dd'))).size;

      // Add summary box
      pdf.setFontSize(14);
      pdf.text('Financial Summary', 20, 85);
      pdf.setFontSize(10);
      pdf.text(`Total Amount: Rs. ${totalAmount.toFixed(2)}`, 25, 95);
      pdf.text(`Average per Transaction: Rs. ${averageAmount.toFixed(2)}`, 25, 105);
      pdf.text(`Highest Amount: Rs. ${maxAmount.toFixed(2)}`, 25, 115);
      pdf.text(`Lowest Amount: Rs. ${minAmount.toFixed(2)}`, 25, 125);
      pdf.text(`Active Days: ${uniqueDays} days`, 25, 135);
      pdf.text(`Daily Average: Rs. ${(totalAmount / uniqueDays).toFixed(2)}`, 25, 145);

      // Prepare enhanced table data
      let runningTotal = 0;
      const tableData = data.map(item => {
        const itemDate = new Date(item.date);
        const dayOfWeek = itemDate.toLocaleDateString('en-US', { weekday: 'short' });
        runningTotal += item.amount;
        
        const category = type === 'expenses' ? 
          (item.amount > 500 ? 'Large' : item.amount > 200 ? 'Medium' : 'Small') : 
          (item.amount > 1000 ? 'Bank' : item.amount > 500 ? 'Card' : 'Cash');
        
        return type === 'expenses'
          ? [
              format(itemDate, 'yyyy-MM-dd'),
              dayOfWeek,
              `Rs. ${item.amount.toFixed(2)}`,
              `Rs. ${runningTotal.toFixed(2)}`,
              category,
              item.note?.substring(0, 20) || 'No note'
            ]
          : [
              format(itemDate, 'yyyy-MM-dd'),
              dayOfWeek,
              `Rs. ${item.amount.toFixed(2)}`,
              `Rs. ${runningTotal.toFixed(2)}`,
              category
            ];
      });

      const headers = type === 'expenses' 
        ? ['Date', 'Day', 'Amount', 'Running Total', 'Category', 'Note'] 
        : ['Date', 'Day', 'Amount', 'Running Total', 'Type'];

      // Add detailed table
      (pdf as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 160,
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [255, 165, 0],
          fontSize: 9,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 20 }, // Day
          2: { cellWidth: 30 }, // Amount
          3: { cellWidth: 35 }, // Running Total
          4: { cellWidth: 20 }, // Category
          5: { cellWidth: 40 }  // Note (if expenses)
        }
      });

      // Add analysis section
      const finalY = (pdf as any).lastAutoTable.finalY + 15;
      pdf.setFontSize(12);
      pdf.text('Spending Analysis', 20, finalY);
      pdf.setFontSize(10);
      
      const spendingCategory = totalAmount > 5000 ? 'High Spender' : totalAmount > 2000 ? 'Medium Spender' : 'Light Spender';
      const activityLevel = data.length > 20 ? 'Very Active' : data.length > 10 ? 'Moderately Active' : 'Light Activity';
      const transactionSize = averageAmount > 300 ? 'Large Transactions' : averageAmount > 150 ? 'Medium Transactions' : 'Small Transactions';
      
      pdf.text(`Spending Category: ${spendingCategory}`, 20, finalY + 15);
      pdf.text(`Activity Level: ${activityLevel}`, 20, finalY + 25);
      pdf.text(`Transaction Pattern: ${transactionSize}`, 20, finalY + 35);
      
      // Add recommendations
      pdf.text('Recommendations:', 20, finalY + 50);
      if (totalAmount > 3000) {
        pdf.text('• Consider monitoring high spending patterns', 25, finalY + 60);
        pdf.text('• Review large transactions for optimization', 25, finalY + 70);
      } else {
        pdf.text('• Spending pattern appears well-controlled', 25, finalY + 60);
        pdf.text('• Continue current financial habits', 25, finalY + 70);
      }

      pdf.save(`detailed_my_${type}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "Export Successful",
        description: `Your comprehensive ${type} report with detailed analysis has been exported to PDF`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export detailed ${type} report`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportToExcel,
    exportToPDF
  };
};
