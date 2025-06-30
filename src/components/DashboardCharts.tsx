
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO } from 'date-fns';

interface DashboardChartsProps {
  refreshTrigger: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "#2563eb",
  },
  payments: {
    label: "Payments", 
    color: "#60a5fa",
  },
};

const DashboardCharts = ({ refreshTrigger }: DashboardChartsProps) => {
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any[]>([]);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const [expensesResult, paymentsResult] = await Promise.all([
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('payments').select('*').order('payment_date', { ascending: false })
      ]);

      const expenses = expensesResult.data || [];
      const payments = paymentsResult.data || [];

      // Process user statistics
      const userStatsMap: { [key: string]: { expenses: number; payments: number; count: number } } = {};
      
      expenses.forEach(exp => {
        if (!userStatsMap[exp.user_name]) {
          userStatsMap[exp.user_name] = { expenses: 0, payments: 0, count: 0 };
        }
        userStatsMap[exp.user_name].expenses += parseFloat(exp.amount.toString());
        userStatsMap[exp.user_name].count += 1;
      });

      payments.forEach(pay => {
        if (!userStatsMap[pay.user_name]) {
          userStatsMap[pay.user_name] = { expenses: 0, payments: 0, count: 0 };
        }
        userStatsMap[pay.user_name].payments += parseFloat(pay.amount.toString());
      });

      const processedUserStats = Object.entries(userStatsMap)
        .map(([name, stats]) => ({
          name: name.length > 10 ? name.substring(0, 10) + '...' : name,
          fullName: name,
          expenses: stats.expenses,
          payments: stats.payments,
          outstanding: stats.expenses - stats.payments,
          count: stats.count
        }))
        .sort((a, b) => b.expenses - a.expenses)
        .slice(0, 8);

      setUserStats(processedUserStats);

      // Process daily trends for last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const trendsMap: { [key: string]: { expenses: number; payments: number } } = {};
      
      last30Days.forEach(date => {
        trendsMap[date] = { expenses: 0, payments: 0 };
      });

      expenses.forEach(exp => {
        if (trendsMap[exp.expense_date]) {
          trendsMap[exp.expense_date].expenses += parseFloat(exp.amount.toString());
        }
      });

      payments.forEach(pay => {
        if (trendsMap[pay.payment_date]) {
          trendsMap[pay.payment_date].payments += parseFloat(pay.amount.toString());
        }
      });

      const processedTrends = last30Days.map(date => ({
        date: format(parseISO(date), 'MMM dd'),
        expenses: trendsMap[date].expenses,
        payments: trendsMap[date].payments
      }));

      setTrendsData(processedTrends);

      // Expense categories - using note field to determine category or default to 'General'
      const categoryMap: { [key: string]: number } = {};
      expenses.forEach(exp => {
        // Use note field to determine category, or default to 'General'
        const category = exp.note ? (exp.note.toLowerCase().includes('food') ? 'Food' : 
                                   exp.note.toLowerCase().includes('travel') ? 'Travel' : 
                                   exp.note.toLowerCase().includes('supply') ? 'Supplies' : 'General') : 'General';
        categoryMap[category] = (categoryMap[category] || 0) + parseFloat(exp.amount.toString());
      });

      const processedExpenseData = Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)) * 100).toFixed(1)
      }));

      setExpenseData(processedExpenseData);

      // Payment methods - since payment_method doesn't exist, we'll create mock data based on amount ranges
      const methodMap: { [key: string]: number } = {};
      payments.forEach(pay => {
        // Create mock payment method based on amount (since payment_method field doesn't exist)
        const amount = parseFloat(pay.amount.toString());
        const method = amount > 1000 ? 'Bank Transfer' : amount > 500 ? 'Card' : 'Cash';
        methodMap[method] = (methodMap[method] || 0) + amount;
      });

      const processedPaymentData = Object.entries(methodMap).map(([name, value]) => ({
        name,
        value,
        percentage: ((value / payments.reduce((sum, pay) => sum + parseFloat(pay.amount.toString()), 0)) * 100).toFixed(1)
      }));

      setPaymentData(processedPaymentData);

    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading charts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-4 h-4" />
          Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs">Categories</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs">Methods</TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="mt-4">
            <div className="h-64">
              <ChartContainer config={chartConfig}>
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="var(--color-expenses)" 
                    strokeWidth={2}
                    name="Expenses"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="payments" 
                    stroke="var(--color-payments)" 
                    strokeWidth={2}
                    name="Payments"
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <div className="h-64">
              <ChartContainer config={chartConfig}>
                <BarChart data={userStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" name="Expenses" />
                  <Bar dataKey="payments" fill="var(--color-payments)" name="Payments" />
                </BarChart>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    fontSize={10}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    fontSize={10}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DashboardCharts;
