
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Calendar, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddExpenseForm from "@/components/AddExpenseForm";
import UsersList from "@/components/UsersList";
import DashboardStats from "@/components/DashboardStats";
import ExpenseHistory from "@/components/ExpenseHistory";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { profile, signOut } = useAuth();

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <h1 className="text-4xl font-bold text-orange-800 mr-3">
              🧡 Canteen Buddy
            </h1>
            {profile && (
              <Badge variant="secondary" className="text-sm">
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </Badge>
            )}
          </div>
          <div className="flex items-center">
            {profile && (
              <span className="text-orange-700 mr-4">
                Welcome, {profile.username}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={signOut} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="add-expense" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="add-expense" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Add Expense
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-expense">
            <Card>
              <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription>
                  Record a payment made by a canteen user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users & Their Totals</CardTitle>
                <CardDescription>
                  View all users and their total spending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersList refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Expense History</CardTitle>
                <CardDescription>
                  View all transactions with search and filter options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseHistory refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard & Analytics</CardTitle>
                <CardDescription>
                  Daily and monthly collection statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardStats refreshTrigger={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
