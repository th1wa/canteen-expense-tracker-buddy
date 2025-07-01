
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import BasicUserBanner from "@/components/BasicUserBanner";
import TabContent from "@/components/TabContent";
import { useAuth } from "@/contexts/AuthContext";
import { useTabManagement } from "@/hooks/useTabManagement";
import { useGlobalProfileListener } from "@/hooks/useGlobalProfileListener";
import { useActivityTracker } from "@/hooks/useActivityTracker";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { profile } = useAuth();
  const { activeTab, setActiveTab } = useTabManagement(profile);

  // Set up global real-time listener for profile changes
  useGlobalProfileListener();
  
  // Track user activity for login/logout monitoring
  useActivityTracker();

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <SidebarInset className="flex-1 flex flex-col w-full min-w-0 ml-0">
          <DashboardHeader />
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden w-full">
            <div className="w-full max-w-none mx-auto space-y-4">
              <BasicUserBanner />
              <TabContent
                activeTab={activeTab}
                profile={profile}
                refreshTrigger={refreshTrigger}
                onExpenseAdded={handleExpenseAdded}
              />
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
