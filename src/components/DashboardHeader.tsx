
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Coffee } from "lucide-react";
import ThemeToggle from './ThemeToggle';
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";

const DashboardHeader = () => {
  const { profile, signOut } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleMap = {
      'user': 'User',
      'admin': 'Admin',
      'hr': 'HR',
      'canteen': 'Canteen'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variantMap = {
      'admin': 'default',
      'hr': 'default',
      'canteen': 'secondary',
      'user': 'outline'
    };
    return variantMap[role as keyof typeof variantMap] || 'secondary';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-full mx-auto px-2 sm:px-4 md:px-6">
        <div className="flex justify-between items-center h-12 sm:h-14 md:h-16 gap-2">
          <div className="flex items-center min-w-0 flex-1 gap-2">
            <SidebarTrigger className="hover:scale-110 active:scale-95 flex-shrink-0" />
            <Coffee className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-600 flex-shrink-0 hover:rotate-12" />
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">
              <span className="hidden xs:inline">Canteen Buddy</span>
              <span className="xs:hidden">Canteen</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {profile && (
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span className="hidden md:inline truncate max-w-[100px] lg:max-w-none">
                  Welcome, {profile.username}
                </span>
                <span className="md:hidden truncate max-w-[80px]">
                  {profile.username}
                </span>
                <Badge 
                  variant={getRoleBadgeVariant(profile.role)} 
                  className="text-xs font-medium hover:scale-105 flex-shrink-0"
                >
                  {getRoleDisplayName(profile.role)}
                </Badge>
              </div>
            )}
            
            <div className="hover:scale-110 flex-shrink-0">
              <ThemeToggle />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-1 text-xs sm:text-sm hover:scale-105 active:scale-95 flex-shrink-0 min-w-0"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
