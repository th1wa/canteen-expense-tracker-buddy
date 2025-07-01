
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
    switch (role) {
      case 'user': return 'User';
      case 'admin': return 'Admin';
      case 'hr': return 'HR';
      case 'canteen': return 'Canteen';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'hr': return 'default';
      case 'canteen': return 'secondary';
      case 'user': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-50 transition-all duration-300 ease-in-out">
      <div className="max-w-full mx-auto px-3 sm:px-4 md:px-6">
        <div className="flex justify-between items-center h-12 sm:h-14 md:h-16">
          <div className="flex items-center min-w-0 flex-1">
            <SidebarTrigger className="mr-2 sm:mr-3 transition-all duration-200 hover:scale-110 active:scale-95" />
            <Coffee className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-orange-600 mr-2 sm:mr-3 flex-shrink-0 transition-transform duration-200 hover:rotate-12" />
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white truncate transition-all duration-200">
              <span className="hidden sm:inline">Canteen Buddy</span>
              <span className="sm:hidden">Canteen</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 flex-shrink-0">
            {profile && (
              <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 animate-fade-in">
                <span className="hidden md:inline">Welcome, {profile.username}</span>
                <span className="md:hidden">Hi, {profile.username}</span>
                <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs font-medium transition-all duration-200 hover:scale-105">
                  {getRoleDisplayName(profile.role)}
                </Badge>
              </div>
            )}
            
            <div className="transition-all duration-200 hover:scale-110">
              <ThemeToggle />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
