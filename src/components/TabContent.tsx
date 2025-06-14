
import React from 'react';
import { PlusCircle, Users, Calendar, TrendingUp, Settings, FileBarChart } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import AddExpenseForm from "@/components/AddExpenseForm";
import UsersList from "@/components/UsersList";
import DashboardStats from "@/components/DashboardStats";
import ExpenseHistory from "@/components/ExpenseHistory";
import LocalBackupSystem from "@/components/LocalBackupSystem";
import UserExpenseSummary from "@/components/UserExpenseSummary";

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
  if (!profile) {
    return (
      <DashboardCard
        title="Loading..."
        description="Please wait while we load your profile"
        icon={Users}
      >
        <div className="text-center py-4 sm:py-6 md:py-8">
          <div className="text-sm sm:text-base">Loading your dashboard...</div>
        </div>
      </DashboardCard>
    );
  }

  const canManageExpenses = profile?.role === 'admin' || profile?.role === 'canteen';
  const canAccessBackup = profile?.role === 'admin';
  const canAccessSummary = profile?.role === 'admin' || profile?.role === 'hr';
  const isBasicUser = profile?.role === 'user';

  switch (activeTab) {
    case 'add-expense':
      if (!canManageExpenses) {
        return (
          <DashboardCard
            title="Access Denied"
            description="You don't have permission to add expenses"
            icon={PlusCircle}
          >
            <div className="text-center py-4 sm:py-6 md:py-8">
              <h2 className="text-lg sm:text-xl font-semibold text-destructive mb-2">Access Denied</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Only admin and canteen staff can add expenses.</p>
            </div>
          </DashboardCard>
        );
      }
      return (
        <DashboardCard
          title="Add New Expense"
          description="Record a payment made by a canteen user"
          icon={PlusCircle}
        >
          <AddExpenseForm onExpenseAdded={onExpenseAdded} />
        </DashboardCard>
      );

    case 'users':
      return (
        <DashboardCard
          title={isBasicUser ? "My Payment Status" : "Users & Payment Status"}
          description={isBasicUser ? "View your spending, payments, and outstanding balance" : "View all users with their spending, payments, and outstanding balances"}
          icon={Users}
        >
          <UsersList refreshTrigger={refreshTrigger} />
        </DashboardCard>
      );

    case 'history':
      return (
        <DashboardCard
          title={isBasicUser ? "My Expense History" : "Expense History"}
          description={isBasicUser ? "View your transaction history" : "View all transactions with search and filter options"}
          icon={Calendar}
        >
          <ExpenseHistory refreshTrigger={refreshTrigger} />
        </DashboardCard>
      );

    case 'dashboard':
      if (isBasicUser) {
        return (
          <DashboardCard
            title="Access Denied"
            description="You don't have permission to view analytics"
            icon={TrendingUp}
          >
            <div className="text-center py-4 sm:py-6 md:py-8">
              <h2 className="text-lg sm:text-xl font-semibold text-destructive mb-2">Access Denied</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Dashboard analytics are only available to staff members.</p>
            </div>
          </DashboardCard>
        );
      }
      return (
        <DashboardCard
          title="Dashboard & Analytics"
          description="Daily and monthly collection statistics with payment tracking"
          icon={TrendingUp}
        >
          <DashboardStats refreshTrigger={refreshTrigger} />
        </DashboardCard>
      );

    case 'summary':
      if (!canAccessSummary) {
        return (
          <DashboardCard
            title="Access Denied"
            description="You don't have permission to view this section"
            icon={FileBarChart}
          >
            <div className="text-center py-4 sm:py-6 md:py-8">
              <h2 className="text-lg sm:text-xl font-semibold text-destructive mb-2">Access Denied</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Only HR and Admin users can access summary reports.</p>
            </div>
          </DashboardCard>
        );
      }
      return (
        <DashboardCard
          title="User Expense & Payment Summary"
          description="Monthly breakdown of all users' expenses and payments"
          icon={FileBarChart}
        >
          <UserExpenseSummary />
        </DashboardCard>
      );

    case 'backup':
      if (!canAccessBackup) {
        return (
          <DashboardCard
            title="Access Denied"
            description="You don't have permission to access backup settings"
            icon={Settings}
          >
            <div className="text-center py-4 sm:py-6 md:py-8">
              <h2 className="text-lg sm:text-xl font-semibold text-destructive mb-2">Access Denied</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Only admin users can access backup and data management.</p>
            </div>
          </DashboardCard>
        );
      }
      return (
        <DashboardCard
          title="Local Backup & Data Management"
          description="Export, import, and manage local database backups"
          icon={Settings}
        >
          <LocalBackupSystem />
        </DashboardCard>
      );

    default:
      return (
        <DashboardCard
          title="Welcome"
          description="Select an option from the sidebar to get started"
          icon={Users}
        >
          <div className="text-center py-4 sm:py-6 md:py-8 text-muted-foreground">
            <p className="text-sm sm:text-base">Choose a section from the sidebar to view content</p>
          </div>
        </DashboardCard>
      );
  }
};

export default TabContent;
