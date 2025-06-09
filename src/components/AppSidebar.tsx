
import React from 'react';
import { Calendar, Users, TrendingUp, PlusCircle, Cloud, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { profile, signOut } = useAuth();

  // Check permissions
  const canManageExpenses = profile && (profile.role === 'admin' || profile.role === 'canteen');
  const canAccessBackup = profile && profile.role === 'admin';

  const menuItems = [
    ...(canManageExpenses ? [{
      id: "add-expense",
      title: "Add Expense",
      icon: PlusCircle,
      description: "Record new expenses"
    }] : []),
    {
      id: "users",
      title: "Users",
      icon: Users,
      description: "View user balances"
    },
    {
      id: "history",
      title: "History",
      icon: Calendar,
      description: "Transaction history"
    },
    {
      id: "dashboard",
      title: "Analytics",
      icon: TrendingUp,
      description: "Stats & insights"
    },
    ...(canAccessBackup ? [{
      id: "backup",
      title: "Backup",
      icon: Cloud,
      description: "Data backup & export"
    }] : [])
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧡</span>
          <div>
            <h2 className="text-lg font-bold text-orange-800 dark:text-orange-200">
              Canteen Buddy
            </h2>
            {profile && (
              <Badge variant="secondary" className="text-xs">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.description}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        {profile && (
          <div className="mb-3 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Welcome back!</div>
            <div className="truncate">{profile.username}</div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="w-full flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
