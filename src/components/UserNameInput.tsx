
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface UserNameInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface User {
  user_name: string;
  first_name: string | null;
  last_name: string | null;
}

export const UserNameInput = ({ value, onChange, className }: UserNameInputProps) => {
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users from the users table
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_name, first_name, last_name')
        .order('user_name');
      
      if (!error && data) {
        setUsers(data);
      }
    };
    
    fetchUsers();
  }, []);

  const getDisplayName = (user: User) => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return fullName ? `${user.user_name} (${fullName})` : user.user_name;
  };

  return (
    <div className={`w-full ${className}`}>
      <Label htmlFor="userName" className="text-xs sm:text-sm md:text-base">User Name</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="form-responsive w-full">
          <SelectValue placeholder="Select user" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-background max-h-60 overflow-y-auto">
          {users.map((user) => (
            <SelectItem key={user.user_name} value={user.user_name} className="cursor-pointer">
              {getDisplayName(user)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
