
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch users from the users table
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_name, first_name, last_name')
        .order('user_name');
      
      if (!error && data) {
        setUserSuggestions(data);
      }
    };
    
    fetchUsers();
  }, []);

  const filteredSuggestions = userSuggestions.filter(user =>
    user.user_name.toLowerCase().includes(value.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(value.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(value.toLowerCase())
  );

  const getDisplayName = (user: User) => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return fullName ? `${user.user_name} (${fullName})` : user.user_name;
  };

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="userName" className="text-sm sm:text-base">User Name</Label>
      <Input
        id="userName"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder="Enter user name (e.g., Kamal)"
        className="text-sm sm:text-base"
        required
      />
      {showSuggestions && value && filteredSuggestions.length > 0 && (
        <Card className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto">
          {filteredSuggestions.slice(0, 5).map((user, index) => (
            <div
              key={index}
              className="p-2 sm:p-3 hover:bg-accent cursor-pointer text-sm sm:text-base"
              onClick={() => {
                onChange(user.user_name);
                setShowSuggestions(false);
              }}
            >
              {getDisplayName(user)}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
