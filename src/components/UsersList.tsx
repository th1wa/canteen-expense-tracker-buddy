
import React, { useState, useEffect } from 'react';
import PaymentModal from "@/components/PaymentModal";
import UserSearch from "@/components/UserSearch";
import UserCard from "@/components/UserCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUsersData } from "@/hooks/useUsersData";
import { UserTotal } from "@/types/user";
import { useToast } from "@/hooks/use-toast";

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

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile?.role === 'admin' || profile?.role === 'canteen';

  useEffect(() => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    const searchTermLower = (searchTerm || '').toLowerCase();
    const filtered = users.filter(user => {
      if (!user?.user_name) return false;
      return user.user_name.toLowerCase().includes(searchTermLower);
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const handlePaymentClick = (user: UserTotal) => {
    if (!canManagePayments || !user) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage payments.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedUser(user);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentAdded = () => {
    refetch();
    // Optional: Show success message
    toast({
      title: "Success",
      description: "Payment has been recorded successfully.",
    });
  };

  const handleModalClose = () => {
    setIsPaymentModalOpen(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="text-center py-4 sm:py-6 md:py-8">
        <div className="text-sm sm:text-base">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 sm:py-6 md:py-8">
        <div className="text-sm sm:text-base text-destructive">
          Error: {error}
        </div>
        <button 
          onClick={refetch}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <UserSearch 
        searchTerm={searchTerm} 
        onSearchChange={(term) => setSearchTerm(term || '')} 
      />

      {filteredUsers.length === 0 ? (
        <div className="text-center py-4 sm:py-6 md:py-8 text-muted-foreground">
          <p className="text-sm sm:text-base">
            {searchTerm ? 'No users found matching your search.' : 'No users found.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.user_name}
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
