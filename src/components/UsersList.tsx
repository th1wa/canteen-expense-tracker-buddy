
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, FilterX, DollarSign, Calendar, User } from "lucide-react";
import { useUsersData } from "@/hooks/useUsersData";
import { useAuth } from "@/contexts/AuthContext";
import UserCard from "./UserCard";
import UserExpenseModal from "./UserExpenseModal";
import PaymentModal from "./PaymentModal";
import { format } from "date-fns";

interface UsersListProps {
  refreshTrigger: number;
}

const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  
  const { profile } = useAuth();
  const hasAccess = profile?.role === 'admin' || profile?.role === 'hr';
  
  const { users, loading, error, totalStats } = useUsersData(refreshTrigger, hasAccess);

  useEffect(() => {
    if (!users) return;

    let filtered = users.filter(user =>
      user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by balance range
    if (balanceFilter && balanceFilter !== 'all') {
      filtered = filtered.filter(user => {
        const balance = user?.balance || 0;
        switch (balanceFilter) {
          case 'positive': return balance > 0;
          case 'zero': return balance === 0;
          case 'low': return balance > 0 && balance <= 500;
          case 'medium': return balance > 500 && balance <= 2000;
          case 'high': return balance > 2000;
          default: return true;
        }
      });
    }

    // Filter by settlement status
    if (settlementFilter && settlementFilter !== 'all') {
      filtered = filtered.filter(user => {
        const balance = user?.balance || 0;
        switch (settlementFilter) {
          case 'settled': return balance === 0;
          case 'pending': return balance > 0;
          default: return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }, [searchTerm, balanceFilter, settlementFilter, users]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setBalanceFilter('');
    setSettlementFilter('');
  };

  const hasActiveFilters = searchTerm || balanceFilter || settlementFilter;

  const handleOpenExpenseModal = (userName: string) => {
    setSelectedUser(userName);
    setShowExpenseModal(true);
  };

  const handleOpenPaymentModal = (userName: string) => {
    setSelectedUser(userName);
    setShowPaymentModal(true);
  };

  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">Please log in to view users.</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">You don't have permission to view all users.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-sm text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive mb-2">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              <FilterX className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Filter */}
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value || '')}
              className="text-xs"
            />
          </div>

          {/* Balance Filter */}
          <Select value={balanceFilter} onValueChange={setBalanceFilter}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="All balances" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All balances</SelectItem>
              <SelectItem value="positive">Has balance</SelectItem>
              <SelectItem value="zero">Zero balance</SelectItem>
              <SelectItem value="low">Rs. 1-500</SelectItem>
              <SelectItem value="medium">Rs. 501-2000</SelectItem>
              <SelectItem value="high">{'>'} Rs. 2000</SelectItem>
            </SelectContent>
          </Select>

          {/* Settlement Filter */}
          <Select value={settlementFilter} onValueChange={setSettlementFilter}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="settled">Fully settled</SelectItem>
              <SelectItem value="pending">Has pending balance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      {totalStats && (
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-blue-600 font-medium">Total Users</p>
                <p className="text-lg font-bold text-blue-700">{filteredUsers.length}</p>
                {hasActiveFilters && (
                  <p className="text-xs text-blue-500">of {users?.length || 0}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-orange-600 font-medium">Total Expenses</p>
                <p className="text-lg font-bold text-orange-700">Rs. {totalStats.totalExpenses.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Total Paid</p>
                <p className="text-lg font-bold text-green-700">Rs. {totalStats.totalPaid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">Total Outstanding</p>
                <p className="text-lg font-bold text-red-700">Rs. {totalStats.totalOutstanding.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {hasActiveFilters ? 'No users found matching your filters.' : 'No users found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.name}
              user={user}
              onOpenExpenseModal={handleOpenExpenseModal}
              onOpenPaymentModal={handleOpenPaymentModal}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <UserExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        userName={selectedUser || ''}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userName={selectedUser || ''}
      />
    </div>
  );
};

export default UsersList;
