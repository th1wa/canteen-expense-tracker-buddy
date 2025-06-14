
import React from 'react';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const UserSearch = ({ searchTerm, onSearchChange }: UserSearchProps) => {
  return (
    <div className="flex items-center space-x-2 w-full">
      <Search className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="form-responsive w-full max-w-full sm:max-w-sm"
      />
    </div>
  );
};

export default UserSearch;
