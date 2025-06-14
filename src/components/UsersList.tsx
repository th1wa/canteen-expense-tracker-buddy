
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PaymentModal from "@/components/PaymentModal";
import UserSearch from "@/components/UserSearch";
import UserCard from "@/components/UserCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUsersData } from "@/hooks/useUsersData";
import { UserTotal } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, FilterX, Users } from "lucide-react";

interface UsersListProps {
  refreshTrigger: number;
}

const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const [filteredUsers, setFilteredUsers] = useState<UserTotal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');
  const [settlementFilter, setSettlementFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserTotal | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { profile } = useAuth();
  const { users, loading, error, refetch } = useUsersData(refreshTrigger);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Memoize permission check to prevent unnecessary recalculations
  const canManagePayments = useMemo(() => 
    profile?.role === 'admin' || profile?.role === 'canteen'
  , [profile?.role]);

  // Memoize search and filter logic
  const processedUsers = useMemo(() => {
    if (!Array.isArray(users)) {
      return [];
    }
    
    let filtered = users;

    // Search filter
    const searchTermLower = (searchTerm || '').trim().toLowerCase();
    if (searchTermLower) {
      filtered = filtered.filter(user => {
        if (!user?.user_name) return false;
        
        const userName = user.user_name.toLowerCase();
        const firstName = (user.first_name || '').toLowerCase();
        const lastName = (user.last_name || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        
        return userName.includes(searchTermLower) || 
               firstName.includes(searchTermLower) ||
               lastName.includes(searchTermLower) ||
               fullName.includes(searchTermLower);
      });
    }

    // Balance filter
    if (balanceFilter && balanceFilter !== 'all') {
      filtered = filtered.filter(user => {
        const balance = user.remaining_balance || 0;
        switch (balanceFilter) {
          case 'low': return balance <= 100;
          case 'medium': return balance > 100 && balance <= 500;
          case 'high': return balance > 500;
          case 'zero': return balance <= 0.01;
          default: return true;
        }
      });
    }

    // Settlement filter
    if (settlementFilter && settlementFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (settlementFilter) {
          case 'settled': return user.is_settled;
          case 'pending': return !user.is_settled;
          default: return true;
        }
      });
    }

    return filtered;
  }, [searchTerm, balanceFilter, settlementFilter, users]);

  // Update filtered users when processed users change
  useEffect(() => {
    setFilteredUsers(processedUsers);
  }, [processedUsers]);

  // Handle payment click with validation
  const handlePaymentClick = useCallback((user: UserTotal) => {
    if (!canManagePayments || !user) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage payments.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate user data before opening modal
    if (!user.user_name || user.total_amount < 0 || user.remaining_balance < 0) {
      toast({
        title: "Invalid User Data",
        description: "This user has invalid payment data. Please contact an administrator.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedUser(user);
    setIsPaymentModalOpen(true);
  }, [canManagePayments, toast]);

  // Handle payment added with success feedback
  const handlePaymentAdded = useCallback(() => {
    refetch();
    toast({
      title: "Success",
      description: "Payment has been recorded successfully.",
    });
  }, [refetch, toast]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedUser(null);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term || '');
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setBalanceFilter('');
    setSettlementFilter('');
  }, []);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const hasActiveFilters = searchTerm || balanceFilter || settlementFilter;

  if (loading) {
    return (
      <div className="text-center py-6 sm:py-8 px-4 container-mobile">
        <div className="text-responsive-sm">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 sm:py-8 px-4 container-mobile">
        <div className="text-responsive-sm text-destructive mb-3">
          Error: {error}
        </div>
        <button 
          onClick={refetch}
          className="btn-mobile mt-2 text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full container-mobile">
      {/* Search and Filters */}
      <div className="space-y-3">
        <UserSearch 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />

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

          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {/* Balance Filter */}
            <Select value={balanceFilter} onValueChange={setBalanceFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All balances" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All balances</SelectItem>
                <SelectItem value="zero">No balance (Rs. 0)</SelectItem>
                <SelectItem value="low">Low (≤ Rs. 100)</SelectItem>
                <SelectItem value="medium">Medium (Rs. 101-500)</SelectItem>
                <SelectItem value="high">High (> Rs. 500)</SelectItem>
              </SelectContent>
            </Select>

            {/* Settlement Filter */}
            <Select value={settlementFilter} onValueChange={setSettlementFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="settled">Settled</SelectItem>
                <SelectItem value="pending">Pending payment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>
      )}

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4 text-muted-foreground">
          <div className="max-w-sm mx-auto">
            <p className="text-responsive-sm mb-4">
              {hasActiveFilters 
                ? 'No users found matching your filters.' 
                : searchTerm 
                ? 'No users found matching your search.' 
                : 'No users found.'
              }
            </p>
            {(searchTerm || hasActiveFilters) && (
              <button 
                onClick={hasActiveFilters ? clearAllFilters : handleClearSearch}
                className="btn-mobile text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                {hasActiveFilters ? 'Clear all filters' : 'Clear search'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {filteredUsers.map((user) => (
            <UserCard
              key={`user-${user.user_name}-${user.total_amount}`}
              user={user}
              canManagePayments={!!canManagePayments}
              onPaymentClick={handlePaymentClick}
            />
          ))}
        </div>
      )}

      {selectedUser && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleModalClose}
          userName={selectedUser.user_name}
          totalAmount={selectedUser.total_amount}
          payments={selectedUser.payments || []}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
};

export default UsersList;
