
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UserExpenseModal from "./UserExpenseModal";

interface UserTotal {
  user_name: string;
  total_amount: number;
  expense_count: number;
}

interface UsersListProps {
  refreshTrigger: number;
}

const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const [users, setUsers] = useState<UserTotal[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserTotal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('user_name, amount')
        .order('user_name');

      if (error) throw error;

      // Group by user and calculate totals
      const userTotals: { [key: string]: UserTotal } = {};
      
      data?.forEach(expense => {
        if (!userTotals[expense.user_name]) {
          userTotals[expense.user_name] = {
            user_name: expense.user_name,
            total_amount: 0,
            expense_count: 0
          };
        }
        userTotals[expense.user_name].total_amount += parseFloat(expense.amount.toString());
        userTotals[expense.user_name].expense_count += 1;
      });

      const usersArray = Object.values(userTotals).sort((a, b) => 
        b.total_amount - a.total_amount
      );
      
      setUsers(usersArray);
      setFilteredUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No users found matching your search.' : 'No expenses recorded yet.'}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((user) => (
            <Card key={user.user_name} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{user.user_name}</h3>
                    <p className="text-gray-600">
                      {user.expense_count} transaction{user.expense_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      Rs. {user.total_amount.toFixed(2)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user.user_name)}
                      className="mt-2"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View History
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedUser && (
        <UserExpenseModal
          userName={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default UsersList;
