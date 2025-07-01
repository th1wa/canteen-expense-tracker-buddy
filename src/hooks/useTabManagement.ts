
import { useState, useEffect } from 'react';

export const useTabManagement = (profile: any) => {
  const [activeTab, setActiveTab] = useState('payment-history');

  // Set default tab based on permissions
  useEffect(() => {
    if (!profile) return;
    
    const isBasicUser = profile.role === 'user';
    const isHRUser = profile.role === 'hr';
    const canManageExpenses = profile.role === 'admin' || profile.role === 'canteen';
    
    if (isHRUser) {
      setActiveTab('payment-history'); // HR users default to payment history
    } else if (isBasicUser) {
      setActiveTab('history'); // Show history for basic users
    } else if (canManageExpenses) {
      setActiveTab('expenses'); // Show add expense for managers
    } else {
      setActiveTab('payment-history');
    }
  }, [profile]);

  return {
    activeTab,
    setActiveTab
  };
};
