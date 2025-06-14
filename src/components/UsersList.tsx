
import React, { useState, useEffect } from 'react';
import { useUsersData } from "@/hooks/useUsersData";
import { useAuth } from "@/contexts/AuthContext";
import PaymentModal from "./PaymentModal";
import { UserTotal } from "@/types/user";
import UserFilters from "./users/UserFilters";
import UserStats from "./users/UserStats";
import UsersGrid from "./users/UsersGrid";
import { supabase } from "@/integrations/supabase/client";

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

  // Set up real-time listener for profile changes that might affect user data
  useEffect(() => {
    if (!hasAccess) return;

    console.log('Setting up real-time listener for profile changes in UsersList');

    const channel = supabase
      .channel('users-list-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profile update detected in UsersList:', payload);
          setLocalRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasAccess]);

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

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile?.role === 'admin' || profile?.role === 'canteen';

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
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

      {/* Summary Stats */}
      {totalStats && (
        <UserStats
          totalUsers={filteredUsers.length}
          originalUsersCount={users?.length}
          totalExpenses={totalStats.totalExpenses}
          totalPaid={totalStats.totalPaid}
          totalOutstanding={totalStats.totalOutstanding}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Users Grid */}
      <UsersGrid
        users={filteredUsers}
        canManagePayments={canManagePayments}
        onPaymentClick={handlePaymentClick}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Payment Modal */}
      {selectedUser && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
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
