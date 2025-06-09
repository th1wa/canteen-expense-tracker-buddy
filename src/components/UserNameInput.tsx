
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

export const UserNameInput = ({ value, onChange, className }: UserNameInputProps) => {
  const [userSuggestions, setUserSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch existing user names for autocomplete
  useEffect(() => {
    const fetchUserNames = async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('user_name')
        .order('user_name');
      
      if (!error && data) {
        const uniqueNames = [...new Set(data.map(item => item.user_name))];
        setUserSuggestions(uniqueNames);
      }
    };
    
    fetchUserNames();
  }, []);

  const filteredSuggestions = userSuggestions.filter(name =>
    name.toLowerCase().includes(value.toLowerCase())
  );

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
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <div
              key={index}
              className="p-2 sm:p-3 hover:bg-accent cursor-pointer text-sm sm:text-base"
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};
