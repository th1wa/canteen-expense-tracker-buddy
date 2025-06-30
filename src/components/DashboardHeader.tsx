
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Coffee } from "lucide-react";
import ThemeToggle from './ThemeToggle';

const DashboardHeader = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Coffee className="h-8 w-8 text-orange-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Canteen Buddy
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {profile && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <span>Welcome, {profile.username}</span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                  {profile.role}
                </span>
              </div>
            )}
            
            <ThemeToggle />
            
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
