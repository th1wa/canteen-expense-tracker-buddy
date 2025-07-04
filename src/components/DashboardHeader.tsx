
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

  const getRoleBadgeVariant = (role: string): "default" | "destructive" | "secondary" | "outline" => {
    const variantMap: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      'admin': 'default',
      'hr': 'secondary',
      'canteen': 'secondary',
      'user': 'outline'
    };
    return variantMap[role] || 'outline';
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-full mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-12 sm:h-14 gap-2">
          <div className="flex items-center min-w-0 flex-1 gap-2">
            <SidebarTrigger className="hover:scale-110 active:scale-95 flex-shrink-0 transition-transform duration-150" />
            <Coffee className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 hover:rotate-12 transition-transform duration-200" />
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
              <span className="hidden xs:inline">Canteen Buddy</span>
              <span className="xs:hidden">Canteen</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {profile && (
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                <span className="hidden md:inline truncate max-w-[100px] lg:max-w-none font-medium">
                  Welcome, {profile.username}
                </span>
                <span className="md:hidden truncate max-w-[80px] font-medium">
                  {profile.username}
                </span>
                <Badge 
                  variant={getRoleBadgeVariant(profile.role)} 
                  className="text-xs font-medium hover:scale-105 flex-shrink-0 transition-transform duration-150"
                >
                  {getRoleDisplayName(profile.role)}
                </Badge>
              </div>
            )}
            
            <div className="hover:scale-110 flex-shrink-0 transition-transform duration-150">
              <ThemeToggle />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-1 text-xs sm:text-sm hover:scale-105 active:scale-95 flex-shrink-0 min-w-0 transition-all duration-150 border-border/50"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
