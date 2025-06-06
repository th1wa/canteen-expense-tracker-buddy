
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Calendar, TrendingUp } from "lucide-react";
import AddExpenseForm from "@/components/AddExpenseForm";
import UsersList from "@/components/UsersList";
import DashboardStats from "@/components/DashboardStats";
import ExpenseHistory from "@/components/ExpenseHistory";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-800 mb-2 flex items-center justify-center gap-2">
            🧡 Canteen Buddy
          </h1>
          <p className="text-orange-600">Digital expense tracking for your canteen</p>
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
