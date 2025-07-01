
import React from 'react';
import { Calendar, Users, PlusCircle, Settings, LogOut, UserCheck, Activity, History, CreditCard, FileBarChart, Menu } from "lucide-react";
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
  SidebarTrigger,
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
  const canViewActivity = profile && profile.role === 'admin'; // Removed HR access
  const canAccessReports = profile && (profile.role === 'admin' || profile.role === 'hr');
  const canAccessPaymentHistory = profile && (profile.role === 'admin' || profile.role === 'hr' || profile.role === 'canteen');
  const isBasicUser = profile && profile.role === 'user';
  const isHRUser = profile && profile.role === 'hr';

  const menuItems = [
    // HR users should NOT see expense history
    ...(!isHRUser ? [{
      id: "expenses",
      title: "Add Expense",
      icon: PlusCircle,
      description: "Record new expenses"
    }] : []),
    ...(!isHRUser ? [{
      id: "history",
      title: isBasicUser ? "My History" : "Expense History",
      icon: History,
      description: isBasicUser ? "Your expense history" : "All expense records"
    }] : []),
    // HR users should NOT see user balances
    ...(!isHRUser ? [{
      id: "payments",
      title: isBasicUser ? "My Balance" : "User Balances",
      icon: Users,
      description: isBasicUser ? "View your balance" : "View user balances and manage payments"
    }] : []),
    ...(canAccessPaymentHistory ? [{
      id: "users",
      title: isBasicUser ? "My Payments" : "Payment History",
      icon: CreditCard,
      description: isBasicUser ? "Your payment records" : "All payment records"
    }] : []),
    ...(canAccessReports ? [{
      id: "reports",
      title: "Reports & Analytics",
      icon: FileBarChart,
      description: "Comprehensive reports with downloadable exports"
    }] : []),
    // HR users should NOT see user activity (only admin)
    ...(canViewActivity ? [{
      id: "activity",
      title: "User Activity",
      icon: Activity,
      description: "View detailed user activity logs"
    }] : []),
    ...(canManageUsers ? [{
      id: "user-management",
      title: "User Management",
      icon: UserCheck,
      description: "Manage user roles and permissions"
    }] : []),
    ...(canAccessBackup ? [{
      id: "backup",
      title: "Backup & Settings",
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
    <Sidebar className="border-r bg-sidebar transition-all duration-300 ease-in-out" collapsible="icon">
      <SidebarHeader className="p-3 sm:p-4 border-b transition-all duration-200">
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl flex-shrink-0 transition-transform duration-200 hover:scale-110">🧡</span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden transition-all duration-200">
            <h2 className="text-base sm:text-lg font-bold text-orange-800 dark:text-orange-200 truncate">
              Canteen Buddy
            </h2>
            {profile && (
              <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs mt-1 animate-fade-in">
                {getRoleDisplayName(profile.role)}
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 sm:px-3 py-3 sm:py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm px-2 mb-2 group-data-[collapsible=icon]:hidden transition-all duration-200">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.id} className="animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.description}
                    className="text-xs sm:text-sm py-2 sm:py-3 px-2 sm:px-3 w-full justify-start hover:bg-sidebar-accent transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-colors duration-200" />
                    <span className="truncate min-w-0 ml-2 sm:ml-3 group-data-[collapsible=icon]:hidden transition-all duration-200">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 sm:p-4 border-t">
        <SidebarSeparator className="mb-3 sm:mb-4" />
        {profile && (
          <div className="mb-3 text-xs sm:text-sm text-muted-foreground group-data-[collapsible=icon]:hidden transition-all duration-200">
            <div className="font-medium text-foreground">Welcome back!</div>
            <div className="truncate">{profile.username}</div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="w-full flex items-center gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
