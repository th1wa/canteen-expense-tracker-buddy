
import React from 'react';
import { UserTotal } from "@/types/user";
import UserCard from "../UserCard";

interface UsersGridProps {
  users: UserTotal[];
  canManagePayments: boolean;
  onPaymentClick: (user: UserTotal) => void;
  hasActiveFilters: boolean;
}

const UsersGrid = ({
  users,
  canManagePayments,
  onPaymentClick,
  hasActiveFilters
}: UsersGridProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {hasActiveFilters ? 'No users found matching your filters.' : 'No users found.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => (
        <UserCard
          key={user.user_name}
          user={user}
          canManagePayments={canManagePayments}
          onPaymentClick={onPaymentClick}
        />
      ))}
    </div>
  );
};

export default UsersGrid;
