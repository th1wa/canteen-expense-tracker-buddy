
import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import ExpenseHistory from "./ExpenseHistory";
import PaymentHistory from "./PaymentHistory";
import UsersList from "./UsersList";
import DashboardStats from "./DashboardStats";
import UserActivity from "./UserActivity";
import BackupSystem from "./BackupSystem";
import UserManagement from "./UserManagement";

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardStats refreshTrigger={refreshTrigger} />;
      
      case 'expenses':
        return (
          <ExpenseHistory 
            refreshTrigger={refreshTrigger} 
            onExpenseAdded={onExpenseAdded} 
          />
        );
      
      case 'payments':
        return <PaymentHistory refreshTrigger={refreshTrigger} />;
      
      case 'users':
        return <UsersList refreshTrigger={refreshTrigger} />;
      
      case 'activity':
        if (!profile || (profile.role !== 'admin' && profile.role !== 'hr')) {
          return (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have permission to view user activity.
              </p>
            </div>
          );
        }
        return <UserActivity />;
      
      case 'user-management':
        if (!profile || profile.role !== 'admin') {
          return (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have permission to manage users.
              </p>
            </div>
          );
        }
        return <UserManagement />;
      
      case 'backup':
        if (!profile || profile.role !== 'admin') {
          return (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                You don't have permission to access backup features.
              </p>
            </div>
          );
        }
        return <BackupSystem />;
      
      default:
        return <DashboardStats refreshTrigger={refreshTrigger} />;
    }
  };

  return (
    <div className="w-full">
      {renderTabContent()}
    </div>
  );
};

export default TabContent;
