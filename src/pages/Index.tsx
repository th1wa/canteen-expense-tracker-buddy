
import React, { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import BasicUserBanner from "@/components/BasicUserBanner";
import TabContent from "@/components/TabContent";
import { useAuth } from "@/contexts/AuthContext";
import { useTabManagement } from "@/hooks/useTabManagement";
import { useGlobalProfileListener } from "@/hooks/useGlobalProfileListener";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { profile } = useAuth();
  const { activeTab, setActiveTab } = useTabManagement(profile);
  const isMobile = useIsMobile();

  useGlobalProfileListener();
  useActivityTracker();

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <DashboardHeader />
          <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 overflow-auto">
            <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
              <BasicUserBanner />
              <TabContent
                activeTab={activeTab}
                profile={profile}
                refreshTrigger={refreshTrigger}
                onExpenseAdded={handleExpenseAdded}
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
