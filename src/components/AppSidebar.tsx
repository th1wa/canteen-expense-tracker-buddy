import React from 'react';
import { Calendar, Users, PlusCircle, Settings, LogOut, UserCheck, Activity, History, CreditCard, FileBarChart, UserPlus } from "lucide-react";
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
import { useIsMobile } from "@/hooks/use-mobile";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { profile, signOut } = useAuth();
  const isMobile = useIsMobile();

  // Check permissions
  const canManageExpenses = profile && (profile.role === 'admin' || profile.role === 'canteen');
  const canAccessBackup = profile && profile.role === 'admin';
  const canManageUsers = profile && profile.role === 'admin';
  const canViewActivity = profile && profile.role === 'admin'; // Removed HR access
  const canAccessReports = profile && (profile.role === 'admin' || profile.role === 'hr');
  const canAccessPaymentHistory = profile && (profile.role === 'admin' || profile.role === 'hr' || profile.role === 'canteen' || profile.role === 'user');
  const isBasicUser = profile && profile.role === 'user';
  const isHRUser = profile && profile.role === 'hr';

  const menuItems = [
    // Admin and canteen users can add expenses
    ...(canManageExpenses ? [{
      id: "expenses",
      title: "Add Expense",
      icon: PlusCircle,
      description: "Record new expenses"
    }] : []),
    
    // Basic users see their own history, others see all (except HR)
    ...(!isHRUser ? [{
      id: "history",
      title: isBasicUser ? "My Expense History" : "Expense History",
      icon: History,
      description: isBasicUser ? "Your expense history with export options" : "All expense records"
    }] : []),
    
    // Payment history for all permitted users including basic users
    ...(canAccessPaymentHistory ? [{
      id: "payment-history",
      title: isBasicUser ? "My Payment History" : "Payment History",
      icon: CreditCard,
      description: isBasicUser ? "Your payment records with export options" : "All payment records"
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
    
    // Admin can add users
    ...(canManageUsers ? [{
      id: "add-user",
      title: "Add User",
      icon: UserPlus,
      description: "Add new users to the system"
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
      case 'user': return 'User';
      case 'admin': return 'Admin';
      case 'hr': return 'HR';
      case 'canteen': return 'Canteen';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (role) {
      case 'admin': return 'default';
      case 'hr': return 'default';
      case 'canteen': return 'secondary';
      case 'user': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Sidebar 
      className="border-r bg-sidebar/95 backdrop-blur-sm transition-all duration-200 ease-in-out shadow-sm" 
      collapsible="icon"
    >
      <SidebarHeader className="p-3 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <span className="text-xl flex-shrink-0 filter drop-shadow-sm">
            🧡
          </span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <h2 className="text-base font-bold text-orange-700 dark:text-orange-300 truncate">
              Canteen Buddy
            </h2>
            {profile && (
              <Badge variant={getRoleBadgeVariant(profile.role)} className="text-xs mt-1 font-medium">
                {getRoleDisplayName(profile.role)}
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs px-3 mb-2 group-data-[collapsible=icon]:hidden font-medium text-muted-foreground/80">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.description}
                    className="text-sm py-2.5 pl-3 pr-4 w-full flex items-center justify-start hover:bg-sidebar-accent/80 transition-all duration-150 rounded-md group"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <item.icon className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-150" />
                      <span className="truncate min-w-0 group-data-[collapsible=icon]:hidden text-left font-medium">
                        {item.title}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        {profile && (
          <div className="mb-3 text-xs text-muted-foreground/80 group-data-[collapsible=icon]:hidden">
            <div className="font-medium text-foreground/90 text-sm">Welcome back!</div>
            <div className="truncate font-medium">{profile.username}</div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 transition-all duration-150 hover:bg-sidebar-accent/80 border-sidebar-border/50"
        >
          <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden font-medium">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
