
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AddUserForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

      // Reset form
      setFormData({
        username: '',
        firstName: '',
        lastName: ''
      });

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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add New User
        </CardTitle>
        <CardDescription>
          Add a new user to the system. Only admins can perform this action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Enter last name"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding User...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddUserForm;
