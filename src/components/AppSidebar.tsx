
import React from 'react';
import { Calendar, Users, TrendingUp, PlusCircle, Settings, LogOut, UserCheck, Activity } from "lucide-react";
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
  const canManageUsers = profile && profile.role === 'admin';
  const canViewActivity = profile && (profile.role === 'admin' || profile.role === 'hr');
  const isBasicUser = profile && profile.role === 'user';

  const menuItems = [
    ...(canManageExpenses ? [{
      id: "expenses",
      title: "Add Expense",
      icon: PlusCircle,
      description: "Record new expenses"
    }] : []),
    ...(canManageUsers ? [{
      id: "user-management",
      title: "User Management",
      icon: UserCheck,
      description: "Manage user roles and permissions"
    }] : []),
    {
      id: "users",
      title: isBasicUser ? "My Status" : "Users",
      icon: Users,
      description: isBasicUser ? "View your balance" : "View user balances"
    },
    {
      id: "payments",
      title: isBasicUser ? "My History" : "History",
      icon: Calendar,
      description: isBasicUser ? "Your transactions" : "Transaction history"
    },
    ...(canViewActivity ? [{
      id: "activity",
      title: "User Activity",
      icon: Activity,
      description: "View user login/logout activity"
    }] : []),
    {
      id: "dashboard",
      title: "Analytics",
      icon: TrendingUp,
      description: "Stats & insights"
    },
    ...(canAccessBackup ? [{
      id: "backup",
      title: "Backup",
      icon: Settings,
      description: "Data backup & management"
    }] : [])
  ];

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'user': return 'Basic User';
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
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧡</span>
          <div>
            <h2 className="text-lg font-bold text-orange-800 dark:text-orange-200">
              Canteen Buddy
            </h2>
            {profile && (
              <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs">
                {getRoleDisplayName(profile.role)}
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
