
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
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-border/50 sticky top-0 z-50 animate-slide-down">
      <div className="max-w-full mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center h-14 sm:h-16 gap-3">
          <div className="flex items-center min-w-0 flex-1 gap-3">
            <SidebarTrigger className="interactive-smooth flex-shrink-0" />
            <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 dark:text-orange-400 flex-shrink-0 animate-float" />
            <h1 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
              <span className="hidden xs:inline text-gradient">Canteen Buddy</span>
              <span className="xs:hidden text-gradient">Canteen</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            {profile && (
              <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 animate-fade-in animation-delay-200">
                <span className="hidden md:inline truncate max-w-[120px] lg:max-w-none font-medium">
                  Welcome, {profile.username}
                </span>
                <span className="md:hidden truncate max-w-[100px] font-medium">
                  {profile.username}
                </span>
                <Badge 
                  variant={getRoleBadgeVariant(profile.role)} 
                  className="text-xs font-medium interactive-smooth flex-shrink-0"
                >
                  {getRoleDisplayName(profile.role)}
                </Badge>
              </div>
            )}
            
            <div className="interactive-smooth flex-shrink-0">
              <ThemeToggle />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-1 text-xs sm:text-sm button-smooth flex-shrink-0 min-w-0 border-border/50"
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
