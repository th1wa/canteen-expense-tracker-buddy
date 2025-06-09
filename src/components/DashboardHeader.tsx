
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardHeader() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-orange-800 dark:text-orange-200">
              Dashboard
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-muted-foreground">Logged in as:</span>
              <Badge variant="outline">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
              <span className="hidden lg:inline text-muted-foreground">
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
