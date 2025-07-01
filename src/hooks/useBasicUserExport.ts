
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

      const headers = type === 'expenses' 
        ? ['Date', 'Amount', 'Note'] 
        : ['Date', 'Amount'];
      
      const csvData = data.map(item => 
        type === 'expenses'
          ? [format(new Date(item.date), 'yyyy-MM-dd'), item.amount.toString(), item.note || '']
          : [format(new Date(item.date), 'yyyy-MM-dd'), item.amount.toString()]
      );

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `my_${type}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Your ${type} have been exported to Excel`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export ${type}`,
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
      
      // Add title
      pdf.setFontSize(20);
      pdf.text(`My ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 20, 20);
      
      // Add user info
      pdf.setFontSize(12);
      pdf.text(`User: ${username}`, 20, 35);
      pdf.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 45);
      
      // Prepare table data
      const tableData = data.map(item => 
        type === 'expenses'
          ? [format(new Date(item.date), 'yyyy-MM-dd'), `Rs. ${item.amount.toFixed(2)}`, item.note || '-']
          : [format(new Date(item.date), 'yyyy-MM-dd'), `Rs. ${item.amount.toFixed(2)}`]
      );

      const headers = type === 'expenses' 
        ? ['Date', 'Amount', 'Note'] 
        : ['Date', 'Amount'];

      // Add table
      (pdf as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 55,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [255, 165, 0] }, // Orange color
      });

      // Add summary
      const total = data.reduce((sum, item) => sum + item.amount, 0);
      const finalY = (pdf as any).lastAutoTable.finalY + 10;
      pdf.setFontSize(12);
      pdf.text(`Total ${type}: Rs. ${total.toFixed(2)}`, 20, finalY);
      pdf.text(`Number of records: ${data.length}`, 20, finalY + 10);

      pdf.save(`my_${type}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "Export Successful",
        description: `Your ${type} have been exported to PDF`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export ${type}`,
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
