
import React, { useState, useEffect } from 'react';
import PaymentModal from "@/components/PaymentModal";
import UserSearch from "@/components/UserSearch";
import UserCard from "@/components/UserCard";
import { useAuth } from "@/contexts/AuthContext";
import { useUsersData } from "@/hooks/useUsersData";
import { UserTotal } from "@/types/user";

interface UsersListProps {
  refreshTrigger: number;
}

const UsersList = ({ refreshTrigger }: UsersListProps) => {
  const [filteredUsers, setFilteredUsers] = useState<UserTotal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserTotal | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { profile } = useAuth();
  const { users, loading, refetch } = useUsersData(refreshTrigger);

  // Check if user can manage payments (admin or canteen)
  const canManagePayments = profile && (profile.role === 'admin' || profile.role === 'canteen');

  useEffect(() => {
    const filtered = users.filter(user =>
      user.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handlePaymentClick = (user: UserTotal) => {
    if (!canManagePayments) {
      return;
    }
    setSelectedUser(user);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentAdded = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="text-center py-4 sm:py-6 md:py-8">
        <div className="text-sm sm:text-base">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <UserSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

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
