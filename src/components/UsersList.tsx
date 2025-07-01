
import React, { useState, useEffect } from 'react';
import { useUsersData } from "@/hooks/useUsersData";
import { useAuth } from "@/contexts/AuthContext";
import PaymentModal from "./PaymentModal";
import { UserTotal } from "@/types/user";
import UserFilters from "./users/UserFilters";
import UserStats from "./users/UserStats";
import UsersGrid from "./users/UsersGrid";

interface UsersListProps {
  refreshTrigger: number;
}

const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserTotal | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<UserTotal[]>([]);
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);
  
  const { profile } = useAuth();
  const hasAccess = profile?.role === 'admin' || profile?.role === 'hr';
  
  const { users, loading, error, totalStats } = useUsersData(refreshTrigger + localRefreshTrigger, hasAccess);

  useEffect(() => {
    if (!users) return;

    let filtered = users.filter(user =>
      user?.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter by balance range
    if (balanceFilter && balanceFilter !== 'all') {
      filtered = filtered.filter(user => {
        const balance = user?.remaining_balance || 0;
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
        const balance = user?.remaining_balance || 0;
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

  const hasActiveFilters = !!(searchTerm || balanceFilter || settlementFilter);

  const handlePaymentClick = (user: UserTotal) => {
    setSelectedUser(user);
    setShowPaymentModal(true);
  };

  const handlePaymentAdded = () => {
    // Refresh the data when a payment is added
    setLocalRefreshTrigger(prev => prev + 1);
  };

  if (!profile) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="text-sm text-muted-foreground">Please log in to view users.</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="text-sm text-muted-foreground">You don't have permission to view all users.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="text-sm text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8 px-4">
        <div className="text-destructive mb-2 text-sm">Error: {error}</div>
      </div>
    );
  }

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile?.role === 'admin' || profile?.role === 'canteen';

  return (
    <div className="w-full max-w-full space-y-4 px-4 sm:px-6">
      {/* Filter Controls */}
      <div className="w-full">
        <UserFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          balanceFilter={balanceFilter}
          setBalanceFilter={setBalanceFilter}
          settlementFilter={settlementFilter}
          setSettlementFilter={setSettlementFilter}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
        />
      </div>

      {/* Summary Stats */}
      {totalStats && (
        <div className="w-full">
          <UserStats
            totalUsers={filteredUsers.length}
            originalUsersCount={users?.length}
            totalExpenses={totalStats.totalExpenses}
            totalPaid={totalStats.totalPaid}
            totalOutstanding={totalStats.totalOutstanding}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Users Grid */}
      <div className="w-full">
        <UsersGrid
          users={filteredUsers}
          canManagePayments={canManagePayments}
          onPaymentClick={handlePaymentClick}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Payment Modal */}
      {selectedUser && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          userName={selectedUser.user_name}
          totalExpense={selectedUser.remaining_balance || 0}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
};

export default UsersList;
