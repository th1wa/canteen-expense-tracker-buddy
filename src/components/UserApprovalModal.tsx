
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingUser {
  id: string;
  username: string;
  created_at: string;
  role: string;
}

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingUsers: PendingUser[];
  onUpdateRole: (userId: string, role: 'admin' | 'hr' | 'canteen' | 'user') => Promise<{ success: boolean; error?: any }>;
}

const UserApprovalModal = ({ isOpen, onClose, pendingUsers, onUpdateRole }: UserApprovalModalProps) => {
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'hr' | 'canteen' | 'user') => {
    if (!userId || !newRole) {
      toast({
        title: "Invalid input",
        description: "Please provide valid user ID and role",
        variant: "destructive",
      });
      return;
    }

    setUpdatingUsers(prev => new Set(prev).add(userId));
    
    try {
      const result = await onUpdateRole(userId, newRole);
      
      if (result.success) {
        toast({
          title: "Role updated successfully",
          description: `User role has been updated to ${newRole}`,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Failed to update role",
        description: error instanceof Error ? error.message : "There was an error updating the user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'hr': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'canteen': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const validPendingUsers = Array.isArray(pendingUsers) ? pendingUsers.filter(user => 
    user && user.id && user.username && user.created_at && user.role
  ) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            User Role Management
          </DialogTitle>
          <DialogDescription>
            Manage user roles and permissions. Users with 'user' role have basic access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {validPendingUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No users requiring role management</p>
            </div>
          ) : (
            validPendingUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{user.username}</h3>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      Registered: {
                        user.created_at ? 
                        new Date(user.created_at).toLocaleDateString() : 
                        'Unknown date'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(value) => handleRoleUpdate(user.id, value as any)}
                    disabled={updatingUsers.has(user.id)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Change role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="canteen">Canteen</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserApprovalModal;
