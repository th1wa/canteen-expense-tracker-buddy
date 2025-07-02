
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, CheckCircle, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AddUserForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear success state when user starts typing again
    if (isSuccess) {
      setIsSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('user_name')
        .eq('user_name', formData.username.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        toast({
          title: "Error",
          description: "A user with this username already exists",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insert new user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          user_name: formData.username.trim(),
          first_name: formData.firstName.trim() || null,
          last_name: formData.lastName.trim() || null
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Success",
        description: "User added successfully",
      });

      // Reset form and show success state
      setFormData({
        username: '',
        firstName: '',
        lastName: ''
      });
      
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);

    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/20 border-2 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              {isSuccess ? (
                <CheckCircle className="w-6 h-6 text-white animate-scale-in" />
              ) : (
                <UserPlus className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Add New User
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Add a new user to the system. Only admins can perform this action.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-3 group">
                <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  Username *
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="Enter username"
                    required
                    className="h-12 bg-white dark:bg-gray-900 border-2 hover:border-blue-300 focus:border-blue-500 transition-all duration-300 pl-4 text-base font-medium group-hover:shadow-md"
                  />
                  <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3 group">
                  <Label htmlFor="firstName" className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Users className="w-4 h-4" />
                    First Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      className="h-12 bg-white dark:bg-gray-900 border-2 hover:border-green-300 focus:border-green-500 transition-all duration-300 pl-4 text-base font-medium group-hover:shadow-md"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3 group">
                  <Label htmlFor="lastName" className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Users className="w-4 h-4" />
                    Last Name
                  </Label>
                  <div className="relative">
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      className="h-12 bg-white dark:bg-gray-900 border-2 hover:border-purple-300 focus:border-purple-500 transition-all duration-300 pl-4 text-base font-medium group-hover:shadow-md"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100 group" 
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Adding User...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-3 animate-scale-in" />
                  User Added Successfully!
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                  Add User
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUserForm;
