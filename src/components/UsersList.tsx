
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, User, DollarSign, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PaymentModal from "@/components/PaymentModal";

interface UserTotal {
  user_name: string;
  total_amount: number;
  total_paid: number;
  remaining_balance: number;
  payment_progress: number;
  is_settled: boolean;
  payments: Array<{
    id: string;
    amount: number;
    payment_date: string;
    created_at: string;
  }>;
}

interface UsersListProps {
  refreshTrigger: number;
}

const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const [users, setUsers] = useState<UserTotal[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserTotal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserTotal | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const fetchUsersWithPayments = async () => {
    setLoading(true);
    try {
      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .order('user_name');

      if (expensesError) throw expensesError;

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('user_name');

      if (paymentsError) throw paymentsError;

      // Group data by user
      const userMap = new Map<string, UserTotal>();

      // Process expenses
      expenses?.forEach(expense => {
        const userName = expense.user_name;
        if (!userMap.has(userName)) {
          userMap.set(userName, {
            user_name: userName,
            total_amount: 0,
            total_paid: 0,
            remaining_balance: 0,
            payment_progress: 0,
            is_settled: false,
            payments: []
          });
        }
        const user = userMap.get(userName)!;
        user.total_amount += parseFloat(expense.amount.toString());
      });

      // Process payments
      payments?.forEach(payment => {
        const userName = payment.user_name;
        if (userMap.has(userName)) {
          const user = userMap.get(userName)!;
          user.total_paid += parseFloat(payment.amount.toString());
          user.payments.push({
            id: payment.id,
            amount: parseFloat(payment.amount.toString()),
            payment_date: payment.payment_date,
            created_at: payment.created_at
          });
        }
      });

      // Calculate remaining balances and progress
      const usersArray = Array.from(userMap.values()).map(user => {
        user.remaining_balance = Math.max(0, user.total_amount - user.total_paid);
        user.payment_progress = user.total_amount > 0 ? (user.total_paid / user.total_amount) * 100 : 0;
        user.is_settled = user.remaining_balance <= 0;
        user.payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return user;
      });

      // Sort by remaining balance (highest first), then by name
      usersArray.sort((a, b) => {
        if (a.is_settled !== b.is_settled) {
          return a.is_settled ? 1 : -1; // Settled users at the bottom
        }
        return b.remaining_balance - a.remaining_balance;
      });

      setUsers(usersArray);
      setFilteredUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users with payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersWithPayments();
  }, [refreshTrigger]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handlePaymentClick = (user: UserTotal) => {
    setSelectedUser(user);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentAdded = () => {
    fetchUsersWithPayments();
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? 'No users found matching your search.' : 'No users found.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.user_name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">{user.user_name}</h3>
                    {user.is_settled && (
                      <Badge className="bg-green-600">Settled ✓</Badge>
                    )}
                  </div>
                  {!user.is_settled && (
                    <Button
                      size="sm"
                      onClick={() => handlePaymentClick(user)}
                      className="flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Rs. {user.total_amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                    <p className="text-lg font-semibold text-green-600">
                      Rs. {user.total_paid.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                    <p className={`text-lg font-semibold ${user.is_settled ? 'text-green-600' : 'text-orange-600'}`}>
                      Rs. {user.remaining_balance.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Payment Progress</span>
                    <span>{Math.min(user.payment_progress, 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(user.payment_progress, 100)} className="h-2" />
                </div>

                {user.payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Recent Payments ({user.payments.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.payments.slice(0, 3).map((payment) => (
                        <Badge key={payment.id} variant="secondary" className="text-xs">
                          Rs. {payment.amount.toFixed(2)}
                        </Badge>
                      ))}
                      {user.payments.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.payments.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedUser && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          userName={selectedUser.user_name}
          totalAmount={selectedUser.total_amount}
          payments={selectedUser.payments}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
};

export default UsersList;
