
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Users, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from 'papaparse';

interface CSVImportProps {
  onImportComplete: () => void;
}

const CSVImport = ({ onImportComplete }: CSVImportProps) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleExpenseCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const expenses = results.data.map((row: any) => ({
            user_name: row.user_name || row.username || row.name,
            amount: parseFloat(row.amount) || 0,
            expense_date: row.expense_date || row.date || new Date().toISOString().split('T')[0],
            description: row.description || row.desc || '',
            category: row.category || 'General'
          })).filter(expense => expense.user_name && expense.amount > 0);

          if (expenses.length === 0) {
            toast({
              title: "No valid data found",
              description: "Please check your CSV format. Required columns: user_name, amount, expense_date",
              variant: "destructive"
            });
            return;
          }

          const { error } = await supabase
            .from('expenses')
            .insert(expenses);

          if (error) throw error;

          toast({
            title: "Import Successful",
            description: `${expenses.length} expenses imported successfully!`,
          });
          
          onImportComplete();
        } catch (error) {
          console.error('Error importing expenses:', error);
          toast({
            title: "Import Failed",
            description: "Failed to import expenses. Please check your CSV format.",
            variant: "destructive"
          });
        } finally {
          setImporting(false);
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        toast({
          title: "CSV Parse Error",
          description: "Failed to parse CSV file. Please check the format.",
          variant: "destructive"
        });
        setImporting(false);
      }
    });
  };

  const handleUserCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const users = results.data.map((row: any) => ({
            user_name: row.user_name || row.username || row.name,
            email: row.email || '',
            phone: row.phone || row.phone_number || '',
            department: row.department || 'General'
          })).filter(user => user.user_name);

          if (users.length === 0) {
            toast({
              title: "No valid data found",
              description: "Please check your CSV format. Required column: user_name",
              variant: "destructive"
            });
            return;
          }

          const { error } = await supabase
            .from('users')
            .insert(users);

          if (error) throw error;

          toast({
            title: "Import Successful",
            description: `${users.length} users imported successfully!`,
          });
          
          onImportComplete();
        } catch (error) {
          console.error('Error importing users:', error);
          toast({
            title: "Import Failed",
            description: "Failed to import users. Please check your CSV format.",
            variant: "destructive"
          });
        } finally {
          setImporting(false);
        }
      }
    });
  };

  const downloadTemplate = (type: 'expenses' | 'users') => {
    let csvContent = '';
    
    if (type === 'expenses') {
      csvContent = 'user_name,amount,expense_date,description,category\nJohn Doe,25.50,2024-01-15,Lunch,Food\nJane Smith,100.00,2024-01-14,Office supplies,Supplies';
    } else {
      csvContent = 'user_name,email,phone,department\nJohn Doe,john@example.com,123-456-7890,IT\nJane Smith,jane@example.com,098-765-4321,HR';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="w-4 h-4" />
            Import Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => downloadTemplate('expenses')}
            className="w-full"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleExpenseCSV}
              disabled={importing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="expense-csv"
            />
            <Button 
              disabled={importing} 
              className="w-full"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Upload Expenses CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4" />
            Import Users
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => downloadTemplate('users')}
            className="w-full"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleUserCSV}
              disabled={importing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="user-csv"
            />
            <Button 
              disabled={importing} 
              className="w-full"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Upload Users CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVImport;
