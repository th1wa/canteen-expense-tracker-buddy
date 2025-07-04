
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
  const canViewActivity = profile && profile.role === 'admin';
  const canAccessReports = profile && (profile.role === 'admin' || profile.role === 'hr');
  const canAccessPaymentHistory = profile && (profile.role === 'admin' || profile.role === 'hr' || profile.role === 'canteen' || profile.role === 'user');
  const isBasicUser = profile && profile.role === 'user';
  const isHRUser = profile && profile.role === 'hr';

  const menuItems = [
    ...(canManageExpenses ? [{
      id: "expenses",
      title: "Add Expense",
      icon: PlusCircle,
      description: "Record new expenses"
    }] : []),
    
    ...(!isHRUser ? [{
      id: "history",
      title: isBasicUser ? "My Expense History" : "Expense History",
      icon: History,
      description: isBasicUser ? "Your expense history with export options" : "All expense records"
    }] : []),
    
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
    
    ...(canViewActivity ? [{
      id: "activity",
      title: "User Activity",
      icon: Activity,
      description: "View detailed user activity logs"
    }] : []),
    
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
      className="border-r bg-sidebar/95 backdrop-blur-sm shadow-sm animate-slide-in-left gpu-accelerated" 
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border/50 animate-fade-in">
        <div className="flex items-center gap-3">
          <span className="text-xl flex-shrink-0 filter drop-shadow-sm animate-float">
            🧡
          </span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <h2 className="text-base font-bold text-gradient truncate">
              Canteen Buddy
            </h2>
            {profile && (
              <Badge 
                variant={getRoleBadgeVariant(profile.role)} 
                className="text-xs mt-1 font-medium animate-scale-in animation-delay-200"
              >
                {getRoleDisplayName(profile.role)}
              </Badge>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs px-3 mb-3 group-data-[collapsible=icon]:hidden font-medium text-muted-foreground/80 animate-fade-in animation-delay-100">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item, index) => (
                <SidebarMenuItem key={item.id} className="animate-fade-in stagger-item">
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    tooltip={item.description}
                    className={`
                      text-sm py-3 px-3 w-full flex items-center justify-start 
                      sidebar-item rounded-lg group relative overflow-hidden
                      ${activeTab === item.id 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm animate-pulse-glow' 
                        : 'hover:bg-sidebar-accent/60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 w-full relative z-10">
                      <item.icon className={`
                        w-4 h-4 flex-shrink-0 transition-all duration-200
                        ${activeTab === item.id 
                          ? 'text-sidebar-primary scale-110' 
                          : 'group-hover:scale-110 group-hover:text-sidebar-primary/80'
                        }
                      `} />
                      <span className="truncate min-w-0 group-data-[collapsible=icon]:hidden text-left font-medium">
                        {item.title}
                      </span>
                    </div>
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 to-transparent opacity-50 animate-fade-in" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border/50 animate-slide-down">
        {profile && (
          <div className="mb-3 text-xs text-muted-foreground/80 group-data-[collapsible=icon]:hidden animate-fade-in">
            <div className="font-medium text-foreground/90 text-sm">Welcome back!</div>
            <div className="truncate font-medium">{profile.username}</div>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="w-full interactive-smooth border-sidebar-border/50 text-xs py-2.5 px-3 font-medium"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
