
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Calendar, TrendingUp, LogOut, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddExpenseForm from "@/components/AddExpenseForm";
import UsersList from "@/components/UsersList";
import DashboardStats from "@/components/DashboardStats";
import ExpenseHistory from "@/components/ExpenseHistory";
import GoogleDriveBackup from "@/components/GoogleDriveBackup";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { profile, signOut } = useAuth();

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Check if user can access expense management (admin or canteen)
  const canManageExpenses = profile && (profile.role === 'admin' || profile.role === 'canteen');
  
  // Check if user can access backup (admin only)
  const canAccessBackup = profile && profile.role === 'admin';

  // Get the number of visible tabs based on role
  const getTabsGridCols = () => {
    if (canAccessBackup && canManageExpenses) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    if (canManageExpenses) return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-800 dark:text-orange-200">
              🧡 Canteen Buddy
            </h1>
            {profile && (
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {profile && (
              <span className="text-sm sm:text-base text-orange-700 dark:text-orange-300 truncate flex-1 sm:flex-none">
                Welcome, {profile.username}
              </span>
            )}
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Out</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue={canManageExpenses ? "add-expense" : "history"} className="w-full">
          <TabsList className={`grid w-full ${getTabsGridCols()} mb-4 sm:mb-6 h-auto`}>
            {canManageExpenses && (
              <TabsTrigger value="add-expense" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <PlusCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Add Expense</span>
                <span className="sm:hidden">Add</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            {canAccessBackup && (
              <TabsTrigger value="backup" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Cloud className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Backup</span>
                <span className="sm:hidden">Backup</span>
              </TabsTrigger>
            )}
          </TabsList>

          {canManageExpenses && (
            <TabsContent value="add-expense">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Add New Expense</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Record a payment made by a canteen user
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="users">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Users & Payment Status</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  View all users with their spending, payments, and outstanding balances
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <UsersList refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Expense History</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  View all transactions with search and filter options
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ExpenseHistory refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Dashboard & Analytics</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Daily and monthly collection statistics with payment tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <DashboardStats refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          {canAccessBackup && (
            <TabsContent value="backup">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Google Drive Backup & Export</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Backup your data to Google Drive and manage existing backups
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <GoogleDriveBackup />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
