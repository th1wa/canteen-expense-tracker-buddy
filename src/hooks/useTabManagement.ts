
import { useState, useEffect } from 'react';
import { getDefaultTab } from '@/utils/tabsConfig';

export const useTabManagement = (profile: any) => {
  const [activeTab, setActiveTab] = useState('users');

  // Set default tab based on permissions
  useEffect(() => {
    if (!profile) return;
    
    const defaultTab = getDefaultTab(profile);
    setActiveTab(defaultTab);
  }, [profile]);

  return {
    activeTab,
    setActiveTab
  };
};
