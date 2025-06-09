
import React, { useState } from 'react';
import { PlusCircle, Users, Calendar, TrendingUp, Cloud } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardCard } from "@/components/DashboardCard";
import AddExpenseForm from "@/components/AddExpenseForm";
import UsersList from "@/components/UsersList";
import DashboardStats from "@/components/DashboardStats";
import ExpenseHistory from "@/components/ExpenseHistory";
import GoogleDriveBackup from "@/components/GoogleDriveBackup";
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

  // Set default tab based on permissions
  React.useEffect(() => {
    if (canManageExpenses && !activeTab) {
      setActiveTab('add-expense');
    } else if (!canManageExpenses && activeTab === 'add-expense') {
      setActiveTab('users');
    }
  }, [canManageExpenses, activeTab]);

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
            title="Users & Payment Status"
            description="View all users with their spending, payments, and outstanding balances"
            icon={Users}
          >
            <UsersList refreshTrigger={refreshTrigger} />
          </DashboardCard>
        );

      case 'history':
        return (
          <DashboardCard
            title="Expense History"
            description="View all transactions with search and filter options"
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

      case 'backup':
        if (!canAccessBackup) return null;
        return (
          <DashboardCard
            title="Google Drive Backup & Export"
            description="Backup your data to Google Drive and manage existing backups"
            icon={Cloud}
          >
            <GoogleDriveBackup />
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
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset className="flex-1">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {renderTabContent()}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
