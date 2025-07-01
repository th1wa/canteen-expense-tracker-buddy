
import { PlusCircle, Calendar, TrendingUp, Settings, FileBarChart, CreditCard, UserPlus } from "lucide-react";

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
  const canAccessReports = profile.role === 'admin' || profile.role === 'hr';
  const canAccessPaymentHistory = profile.role === 'admin' || profile.role === 'hr' || profile.role === 'canteen';
  const isBasicUser = profile.role === 'user';
  const isHRUser = profile.role === 'hr';
  const isAdmin = profile.role === 'admin';

  const tabs: TabConfig[] = [];

  // Add Expense comes first for canteen and admin users
  if (canManageExpenses) {
    tabs.push({
      id: 'expenses',
      title: 'Add New Expense', 
      description: 'Record a payment made by a canteen user',
      icon: PlusCircle
    });
  }

  // Basic users see their expense history
  if (isBasicUser) {
    tabs.push({
      id: 'history',
      title: 'My Expense History',
      description: 'View your transaction history with download options',
      icon: Calendar
    });
    
    tabs.push({
      id: 'payment-history',
      title: 'My Payment History',
      description: 'View your payment records with download options',
      icon: CreditCard
    });
  } else {
    // HR users should not see expense history
    if (!isHRUser) {
      tabs.push({
        id: 'history',
        title: 'Expense History',
        description: 'View all transactions with search and filter options',
        icon: Calendar
      });
    }

    // Payment History - available for admin, HR, and canteen users
    if (canAccessPaymentHistory) {
      tabs.push({
        id: 'payment-history',
        title: 'Payment History',
        description: 'View payment records and transactions',
        icon: CreditCard
      });
    }
  }

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

  // Add User tab - only for admins
  if (isAdmin) {
    tabs.push({
      id: 'add-user',
      title: 'Add User',
      description: 'Add new users to the system',
      icon: UserPlus
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
  if (!profile) return 'payment-history';
  
  const isBasicUser = profile.role === 'user';
  const canManageExpenses = profile.role === 'admin' || profile.role === 'canteen';
  const isHRUser = profile.role === 'hr';
  
  // HR users default to payment history
  if (isHRUser) {
    return 'payment-history';
  }
  
  // Basic users default to their expense history
  if (isBasicUser) {
    return 'history';
  }
  
  // Canteen users default to add expense
  if (profile.role === 'canteen') {
    return 'expenses';
  }
  
  if (canManageExpenses) {
    return 'expenses';
  }
  
  return 'payment-history';
};
