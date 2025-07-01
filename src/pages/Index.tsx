
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
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 transition-all duration-300 ease-in-out">
        <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader />
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            <div className="w-full max-w-7xl mx-auto space-y-3 sm:space-y-4">
              <div className="animate-fade-in">
                <BasicUserBanner />
              </div>
              <div className="animate-fade-in animation-delay-100">
                <TabContent
                  activeTab={activeTab}
                  profile={profile}
                  refreshTrigger={refreshTrigger}
                  onExpenseAdded={handleExpenseAdded}
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
