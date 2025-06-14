
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardHeader() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container flex h-12 sm:h-14 items-center justify-between px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="md:hidden btn-touch transition-all duration-200 hover:scale-110 hover:shadow-md active:scale-95" />
          <div className="hidden sm:block">
            <h1 className="text-lg sm:text-xl font-bold text-orange-800 dark:text-orange-200 transition-colors">
              Dashboard
            </h1>
          </div>
          <div className="block sm:hidden">
            <h1 className="text-base font-bold text-orange-800 dark:text-orange-200 transition-colors">
              Dashboard
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {profile && (
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm animate-in fade-in duration-300">
              <span className="hidden lg:inline text-muted-foreground transition-colors">Logged in as:</span>
              <Badge variant="outline" className="text-xs sm:text-sm transition-all duration-200 hover:scale-105">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
              <span className="hidden xl:inline text-muted-foreground text-xs sm:text-sm transition-colors">
                ({profile.username})
              </span>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
