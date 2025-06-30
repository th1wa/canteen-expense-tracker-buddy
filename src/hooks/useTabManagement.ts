
import { useState, useEffect } from 'react';

export const useTabManagement = (profile: any) => {
  const [activeTab, setActiveTab] = useState('users');

  // Set default tab based on permissions
  useEffect(() => {
    if (!profile) return;
    
    const isBasicUser = profile.role === 'user';
    const canManageExpenses = profile.role === 'admin' || profile.role === 'canteen';
    
    if (isBasicUser) {
      setActiveTab('users');
    } else if (canManageExpenses) {
      setActiveTab('expenses');
    } else {
      setActiveTab('users');
    }
  }, [profile]);

  return {
    activeTab,
    setActiveTab
  };
};
