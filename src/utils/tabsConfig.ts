
import { PlusCircle, Users, Calendar, TrendingUp, Settings, FileBarChart } from "lucide-react";

export interface TabConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  adminOnly?: boolean;
  canteenOnly?: boolean;
  hrOnly?: boolean;
  staffOnly?: boolean;
}

export const getTabsConfig = (profile: any): TabConfig[] => {
  if (!profile) return [];

  const canManageExpenses = profile.role === 'admin' || profile.role === 'canteen';
  const canAccessBackup = profile.role === 'admin';
  const canAccessSummary = profile.role === 'admin' || profile.role === 'hr';
  const canAccessReports = profile.role === 'admin' || profile.role === 'hr';
  const isBasicUser = profile.role === 'user';

  const tabs: TabConfig[] = [];

  if (canManageExpenses) {
    tabs.push({
      id: 'add-expense',
      title: 'Add New Expense',
      description: 'Record a payment made by a canteen user',
      icon: PlusCircle
    });
  }

  tabs.push({
    id: 'users',
    title: isBasicUser ? 'My Payment Status' : 'Users & Payment Status',
    description: isBasicUser 
      ? 'View your spending, payments, and outstanding balance' 
      : 'View all users with their spending, payments, and outstanding balances',
    icon: Users
  });

  tabs.push({
    id: 'history',
    title: isBasicUser ? 'My Expense History' : 'Expense History',
    description: isBasicUser 
      ? 'View your transaction history' 
      : 'View all transactions with search and filter options',
    icon: Calendar
  });

  if (!isBasicUser) {
    tabs.push({
      id: 'dashboard',
      title: 'Dashboard & Analytics',
      description: 'Daily and monthly collection statistics with payment tracking',
      icon: TrendingUp
    });
  }

  if (canAccessReports) {
    tabs.push({
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'Comprehensive sales reports with downloadable PDF and Excel exports',
      icon: FileBarChart
    });
  }

  if (canAccessSummary) {
    tabs.push({
      id: 'summary',
      title: 'User Expense & Payment Summary',
      description: 'Monthly breakdown of all users\' expenses and payments',
      icon: FileBarChart
    });
  }

  if (canAccessBackup) {
    tabs.push({
      id: 'backup',
      title: 'Local Backup & Data Management',
      description: 'Export, import, and manage local database backups',
      icon: Settings
    });
  }

  return tabs;
};

export const getDefaultTab = (profile: any): string => {
  if (!profile) return 'users';
  
  const isBasicUser = profile.role === 'user';
  const canManageExpenses = profile.role === 'admin' || profile.role === 'canteen';
  
  if (isBasicUser) {
    return 'users';
  } else if (canManageExpenses) {
    return 'add-expense';
  }
  
  return 'users';
};
