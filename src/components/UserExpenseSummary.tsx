
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

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

const UserExpenseSummary = () => {
  const [summaryData, setSummaryData] = useState<UserSummary[]>([]);
  const [filteredData, setFilteredData] = useState<UserSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { profile } = useAuth();

  // Check if user has admin or hr role
  const hasAccess = profile && (profile.role === 'admin' || profile.role === 'hr');

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
      setFilteredData(summaryArray);
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData();
  }, [selectedMonth, hasAccess]);

  useEffect(() => {
    const filtered = summaryData.filter(user =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchTerm, summaryData]);

  // Calculate totals
  const grandTotals = filteredData.reduce(
    (acc, user) => ({
      totalUsers: acc.totalUsers + 1,
      totalExpenses: acc.totalExpenses + user.total_expenses,
      totalPaid: acc.totalPaid + user.total_paid,
      totalRemaining: acc.totalRemaining + user.total_remainder
    }),
    { totalUsers: 0, totalExpenses: 0, totalPaid: 0, totalRemaining: 0 }
  );

  if (!hasAccess) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading summary data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Expense & Payment Summary</h2>
          <p className="text-gray-600">Monthly breakdown of user expenses and payments</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = format(date, 'yyyy-MM');
                  return (
                    <SelectItem key={value} value={value}>
                      {format(date, 'MMMM yyyy')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{grandTotals.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold">Rs. {grandTotals.totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold">Rs. {grandTotals.totalPaid.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Total Remaining</p>
                <p className="text-2xl font-bold">Rs. {grandTotals.totalRemaining.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No users found matching your search.' : 'No data found for this month.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((user) => (
                <Card key={user.user_name} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{user.user_name}</h3>
                        <Badge variant={user.total_remainder > 0 ? "destructive" : "default"}>
                          Balance: Rs. {user.total_remainder.toFixed(2)}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedUser(expandedUser === user.user_name ? null : user.user_name)}
                      >
                        {expandedUser === user.user_name ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-lg font-semibold">Rs. {user.total_expenses.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Paid</p>
                        <p className="text-lg font-semibold text-green-600">Rs. {user.total_paid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Remaining</p>
                        <p className={`text-lg font-semibold ${user.total_remainder > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Rs. {user.total_remainder.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {expandedUser === user.user_name && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Daily Breakdown</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Expense Amount</th>
                                <th className="text-left p-2">Payment Made</th>
                                <th className="text-left p-2">Payment Date</th>
                                <th className="text-left p-2">Remainder</th>
                              </tr>
                            </thead>
                            <tbody>
                              {user.daily_records.map((record, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2">{format(new Date(record.expense_date), 'dd/MM/yyyy')}</td>
                                  <td className="p-2">Rs. {parseFloat(record.expense_amount.toString()).toFixed(2)}</td>
                                  <td className="p-2">
                                    <Badge variant={record.payment_made ? "default" : "secondary"}>
                                      {record.payment_made ? 'Yes' : 'No'}
                                    </Badge>
                                  </td>
                                  <td className="p-2">
                                    {record.payment_date ? format(new Date(record.payment_date), 'dd/MM/yyyy') : '-'}
                                  </td>
                                  <td className="p-2">
                                    <span className={parseFloat(record.remainder_amount.toString()) > 0 ? 'text-red-600' : 'text-green-600'}>
                                      Rs. {parseFloat(record.remainder_amount.toString()).toFixed(2)}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserExpenseSummary;
