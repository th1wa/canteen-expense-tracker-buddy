
import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import ExpenseHistory from "./ExpenseHistory";
import PaymentHistory from "./PaymentHistory";
import UsersList from "./UsersList";
import DashboardStats from "./DashboardStats";
import UserActivity from "./UserActivity";
import BackupSystem from "./BackupSystem";
import UserManagement from "./UserManagement";
import AddExpenseForm from "./AddExpenseForm";
import ReportsAnalytics from "./ReportsAnalytics";

interface TabContentProps {
  activeTab: string;
  profile: any;
  refreshTrigger: number;
  onExpenseAdded: () => void;
}

const TabContent: React.FC<TabContentProps> = ({ 
  activeTab, 
  profile, 
  refreshTrigger, 
  onExpenseAdded 
}) => {
  const { user } = useAuth();
  const [localRefreshTrigger, setLocalRefreshTrigger] = useState(0);

  const handleExpenseAdded = () => {
    // Trigger refresh in parent and local components
    onExpenseAdded();
    setLocalRefreshTrigger(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in">
            <DashboardStats refreshTrigger={refreshTrigger + localRefreshTrigger} />
          </div>
        );
      
      case 'expenses':
        return (
          <div className="animate-fade-in">
            <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
          </div>
        );
      
      case 'history':
        // HR users should not access expense history
        if (profile?.role === 'hr') {
          return (
            <div className="text-center py-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                HR users don't have permission to view expense history.
              </p>
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <ExpenseHistory 
              refreshTrigger={refreshTrigger + localRefreshTrigger} 
              onExpenseAdded={handleExpenseAdded}
            />
          </div>
        );
      
      case 'payments':
        // HR users should not access user balances
        if (profile?.role === 'hr') {
          return (
            <div className="text-center py-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                HR users don't have permission to view user balances.
              </p>
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <PaymentHistory refreshTrigger={refreshTrigger + localRefreshTrigger} />
          </div>
        );
      
      case 'users':
        // For canteen users, this shows payment history where they can add payments
        if (profile?.role === 'canteen') {
          return (
            <div className="animate-fade-in">
              <PaymentHistory refreshTrigger={refreshTrigger + localRefreshTrigger} />
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <UsersList refreshTrigger={refreshTrigger + localRefreshTrigger} />
          </div>
        );

      case 'payment-history':
        return (
          <div className="animate-fade-in">
            <PaymentHistory refreshTrigger={refreshTrigger + localRefreshTrigger} />
          </div>
        );
      
      case 'reports':
        if (!profile || (profile.role !== 'admin' && profile.role !== 'hr')) {
          return (
            <div className="text-center py-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have permission to view reports and analytics.
              </p>
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <ReportsAnalytics />
          </div>
        );
      
      case 'activity':
        // Only admin can access user activity (HR removed)
        if (!profile || profile.role !== 'admin') {
          return (
            <div className="text-center py-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Only administrators can view user activity.
              </p>
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <UserActivity />
          </div>
        );
      
      case 'user-management':
        if (!profile || profile.role !== 'admin') {
          return (
            <div className="text-center py-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have permission to manage users.
              </p>
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <UserManagement />
          </div>
        );
      
      case 'backup':
        if (!profile || profile.role !== 'admin') {
          return (
            <div className="text-center py-8 animate-fade-in">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have permission to access backup features.
              </p>
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <BackupSystem />
          </div>
        );
      
      default:
        // Default to payment history for HR users, expense history for others
        if (profile?.role === 'hr') {
          return (
            <div className="animate-fade-in">
              <PaymentHistory refreshTrigger={refreshTrigger + localRefreshTrigger} />
            </div>
          );
        }
        return (
          <div className="animate-fade-in">
            <ExpenseHistory 
              refreshTrigger={refreshTrigger + localRefreshTrigger} 
              onExpenseAdded={handleExpenseAdded}
            />
          </div>
        );
    }
  };

  return (
    <div className="w-full min-h-full transition-all duration-300 ease-in-out">
      {renderTabContent()}
    </div>
  );
};

export default TabContent;
