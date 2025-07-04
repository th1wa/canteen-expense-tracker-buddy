
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
  const hasAccess = profile?.role === 'admin' || profile?.role === 'hr' || profile?.role === 'canteen';
  
  const { users, loading, error, totalStats } = useUsersData(refreshTrigger + localRefreshTrigger, hasAccess);

  useEffect(() => {
    if (!users) return;

    let filtered = users.filter(user =>
      user?.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    if (settlementFilter && settlementFilter !== 'all') {
      filtered = filtered.filter(user => {
        const balance = user?.remaining_balance || 0;
        return settlementFilter === 'settled' ? balance === 0 : balance > 0;
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
    setLocalRefreshTrigger(prev => prev + 1);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <div className="text-center">
          <div className="text-responsive-sm text-muted-foreground">Please log in to view users.</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <div className="text-center">
          <div className="text-responsive-sm text-muted-foreground">You don't have permission to view all users.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div className="text-responsive-sm text-muted-foreground">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px] p-4">
        <div className="text-center space-y-2">
          <div className="text-destructive text-responsive-sm font-medium">Error: {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-mobile bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const canManagePayments = profile?.role === 'admin' || profile?.role === 'canteen';

  return (
    <div className="w-full space-y-4 sm:space-y-6 container-mobile">
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

      <div className="w-full">
        <UsersGrid
          users={filteredUsers}
          canManagePayments={canManagePayments}
          onPaymentClick={handlePaymentClick}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

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
