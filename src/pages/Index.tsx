
import React, { useState } from 'react';
import { PlusCircle, Users, Calendar, TrendingUp, Settings, FileBarChart } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardCard } from "@/components/DashboardCard";
import AddExpenseForm from "@/components/AddExpenseForm";
import UsersList from "@/components/UsersList";
import DashboardStats from "@/components/DashboardStats";
import ExpenseHistory from "@/components/ExpenseHistory";
import LocalBackupSystem from "@/components/LocalBackupSystem";
import UserExpenseSummary from "@/components/UserExpenseSummary";
import BasicUserBanner from "@/components/BasicUserBanner";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('users');
  const { profile } = useAuth();

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Check permissions
  const canManageExpenses = profile && (profile.role === 'admin' || profile.role === 'canteen');
  const canAccessBackup = profile && profile.role === 'admin';
  const canAccessSummary = profile && (profile.role === 'admin' || profile.role === 'hr');
  const isBasicUser = profile && profile.role === 'user';

  // Set default tab based on permissions
  React.useEffect(() => {
    if (isBasicUser) {
      setActiveTab('users'); // Basic users can only see their own data in users tab
    } else if (canManageExpenses && !activeTab) {
      setActiveTab('add-expense');
    } else if (!canManageExpenses && activeTab === 'add-expense') {
      setActiveTab('users');
    }
  }, [canManageExpenses, activeTab, isBasicUser]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'add-expense':
        if (!canManageExpenses) return null;
        return (
          <DashboardCard
            title="Add New Expense"
            description="Record a payment made by a canteen user"
            icon={PlusCircle}
          >
            <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
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
        if (!canAccessSummary) return null;
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
        if (!canAccessBackup) return null;
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
            <div className="text-center py-8 text-muted-foreground">
              <p>Choose a section from the sidebar to view content</p>
            </div>
          </DashboardCard>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset className="flex-1">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <BasicUserBanner />
              {renderTabContent()}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
