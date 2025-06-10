
import React from 'react';
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface UserSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const UserSearch = ({ searchTerm, onSearchChange }: UserSearchProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Search className="w-4 h-4 text-muted-foreground" />
      <Input
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm text-sm sm:text-base"
      />
    </div>
  );
};

export default UserSearch;
