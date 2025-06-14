
import React, { useState, useEffect, useCallback } from 'react';
import PaymentModal from "@/components/PaymentModal";
import UserSearch from "@/components/UserSearch";
import UserCard from "@/components/UserCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUsersData } from "@/hooks/useUsersData";
import { UserTotal } from "@/types/user";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface UsersListProps {
  refreshTrigger: number;
}

const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const [filteredUsers, setFilteredUsers] = useState<UserTotal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserTotal | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { profile } = useAuth();
  const { users, loading, error, refetch } = useUsersData(refreshTrigger);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile?.role === 'admin' || profile?.role === 'canteen';

  // Memoize search filtering to prevent unnecessary recalculations
  useEffect(() => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    const searchTermLower = (searchTerm || '').trim().toLowerCase();
    
    if (!searchTermLower) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => {
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
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Handle error display with toast (only show once per error)
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

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

  const handlePaymentAdded = useCallback(() => {
    refetch();
    toast({
      title: "Success",
      description: "Payment has been recorded successfully.",
    });
  }, [refetch, toast]);

  const handleModalClose = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedUser(null);
  }, []);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term || '');
  }, []);

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
      <UserSearch 
        searchTerm={searchTerm} 
        onSearchChange={handleSearchChange} 
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4 text-muted-foreground">
          <div className="max-w-sm mx-auto">
            <p className="text-responsive-sm mb-4">
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="btn-mobile text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {filteredUsers.map((user) => (
            <UserCard
              key={`user-${user.user_name}`}
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
          payments={selectedUser.payments}
          onPaymentAdded={handlePaymentAdded}
        />
      )}
    </div>
  );
};

export default UsersList;
