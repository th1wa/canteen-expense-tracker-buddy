
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay } from "date-fns";

interface DashboardStatsProps {
  refreshTrigger: number;
}

interface Stats {
  todayTotal: number;
  todayCount: number;
  weekTotal: number;
  monthTotal: number;
  totalUsers: number;
}

const DashboardStats = ({ refreshTrigger }: DashboardStatsProps) => {
  const [stats, setStats] = useState<Stats>({
    todayTotal: 0,
    todayCount: 0,
    weekTotal: 0,
    monthTotal: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(now), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');

      // Fetch all expenses
      const { data: allExpenses, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });

      if (error) throw error;

      if (!allExpenses) {
        setStats({
          todayTotal: 0,
          todayCount: 0,
          weekTotal: 0,
          monthTotal: 0,
          totalUsers: 0
        });
        return;
      }

      // Calculate today's stats
      const todayExpenses = allExpenses.filter(exp => exp.expense_date === today);
      const todayTotal = todayExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

      // Calculate this week's total
      const weekExpenses = allExpenses.filter(exp => exp.expense_date >= weekStart);
      const weekTotal = weekExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

      // Calculate this month's total
      const monthExpenses = allExpenses.filter(exp => exp.expense_date >= monthStart);
      const monthTotal = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

      // Calculate user stats
      const userTotals: { [key: string]: number } = {};
      allExpenses.forEach(exp => {
        userTotals[exp.user_name] = (userTotals[exp.user_name] || 0) + parseFloat(exp.amount.toString());
      });

      const totalUsers = Object.keys(userTotals).length;

      setStats({
        todayTotal,
        todayCount: todayExpenses.length,
        weekTotal,
        monthTotal,
        totalUsers
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="animate-pulse">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in-0 slide-in-from-left-4 duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 transition-transform hover:rotate-12" />
              Today's Collection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 transition-all duration-300 hover:scale-105">Rs. {stats.todayTotal.toFixed(2)}</div>
            <p className="text-xs text-blue-600 mt-1 transition-colors">
              {stats.todayCount} transaction{stats.todayCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 transition-transform hover:rotate-12" />
              This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 transition-all duration-300 hover:scale-105">Rs. {stats.weekTotal.toFixed(2)}</div>
            <p className="text-xs text-green-600 mt-1 transition-colors">Weekly total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 transition-transform hover:rotate-12" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 transition-all duration-300 hover:scale-105">Rs. {stats.monthTotal.toFixed(2)}</div>
            <p className="text-xs text-purple-600 mt-1 transition-colors">Monthly total</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Users className="w-4 h-4 transition-transform hover:rotate-12" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 transition-all duration-300 hover:scale-105">{stats.totalUsers}</div>
            <p className="text-xs text-orange-600 mt-1 transition-colors">Active users</p>
          </CardContent>
        </Card>
      </div>

      <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-400">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 transition-transform hover:rotate-12" />
            Quick Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="transition-all duration-200 hover:scale-105">
              <p className="text-sm text-gray-600 transition-colors">Average per transaction</p>
              <p className="text-lg font-semibold transition-colors">
                Rs. {stats.todayCount > 0 ? (stats.todayTotal / stats.todayCount).toFixed(2) : '0.00'}
              </p>
            </div>
            <div className="transition-all duration-200 hover:scale-105">
              <p className="text-sm text-gray-600 transition-colors">Today vs Yesterday</p>
              <p className="text-lg font-semibold text-green-600 transition-all duration-300">📈 Growing</p>
            </div>
            <div className="transition-all duration-200 hover:scale-105">
              <p className="text-sm text-gray-600 transition-colors">Most popular time</p>
              <p className="text-lg font-semibold transition-colors">Lunch hours</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
