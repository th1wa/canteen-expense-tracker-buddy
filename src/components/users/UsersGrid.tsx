
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
      <div className="flex items-center justify-center min-h-[200px] p-4 animate-fade-in">
        <div className="text-center space-y-3">
          <div className="text-4xl sm:text-6xl mb-4 animate-bounce-in">👥</div>
          <div className="text-responsive-base font-medium text-muted-foreground animate-fade-in animation-delay-200">
            {hasActiveFilters ? 'No users found matching your filters.' : 'No users found.'}
          </div>
          {hasActiveFilters && (
            <div className="text-responsive-sm text-muted-foreground animate-fade-in animation-delay-300">
              Try adjusting your search or filter criteria.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {users.map((user, index) => (
        <div 
          key={user.user_name}
          className="animate-fade-in stagger-item card-hover"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <UserCard
            user={user}
            canManagePayments={canManagePayments}
            onPaymentClick={onPaymentClick}
          />
        </div>
      ))}
    </div>
  );
};

export default UsersGrid;
