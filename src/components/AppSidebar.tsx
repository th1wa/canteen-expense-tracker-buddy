
import React from 'react';
import { Calendar, Users, PlusCircle, Settings, LogOut, UserCheck, Activity, History, CreditCard, FileBarChart } from "lucide-react";
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
  const canAccessReports = profile && (profile.role === 'admin' || profile.role === 'hr');
  const isBasicUser = profile && profile.role === 'user';

  const menuItems = [
    ...(canManageExpenses ? [{
      id: "expenses",
      title: "Add Expense",
      icon: PlusCircle,
      description: "Record new expenses"
    }] : []),
    {
      id: "history",
      title: isBasicUser ? "My History" : "Expense History",
      icon: History,
      description: isBasicUser ? "Your expense history" : "All expense records"
    },
    {
      id: "payments",
      title: isBasicUser ? "My Status" : "User Balances",
      icon: Users,
      description: isBasicUser ? "View your balance" : "View user balances and manage payments"
    },
    {
      id: "users",
      title: isBasicUser ? "My Payments" : "Payment History",
      icon: CreditCard,
      description: isBasicUser ? "Your payment records" : "All payment records"
    },
    ...(canAccessReports ? [{
      id: "reports",
      title: "Reports & Analytics",
      icon: FileBarChart,
      description: "Comprehensive reports with downloadable exports"
    }] : []),
    ...(canManageUsers ? [{
      id: "user-management",
      title: "User Management",
      icon: UserCheck,
      description: "Manage user roles and permissions"
    }] : []),
    ...(canViewActivity ? [{
      id: "activity",
      title: "User Activity",
      icon: Activity,
      description: "View detailed user activity logs"
    }] : []),
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
    <Sidebar className="sidebar-mobile">
      <SidebarHeader className="p-2 sm:p-3 md:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl md:text-2xl">🧡</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-orange-800 dark:text-orange-200 truncate">
              Canteen Buddy
            </h2>
            {profile && (
              <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs mt-1">
                {getRoleDisplayName(profile.role)}
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 sm:px-2 md:px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm px-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.description}
                    className="text-xs sm:text-sm md:text-base py-2 sm:py-3 px-2 sm:px-3"
                  >
                    <item.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate min-w-0">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 sm:p-3 md:p-4">
        <SidebarSeparator className="mb-2 sm:mb-3 md:mb-4" />
        {profile && (
          <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Welcome back!</div>
            <div className="truncate">{profile.username}</div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="w-full flex items-center gap-1 sm:gap-2 text-xs sm:text-sm btn-mobile"
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
