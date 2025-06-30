
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface PendingUser {
  id: string;
  username: string;
  created_at: string;
  updated_at: string;
  role: 'admin' | 'hr' | 'canteen' | 'user';
  first_name: string | null;
  last_name: string | null;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingUsers: PendingUser[];
  onUpdateRole: (userId: string, newRole: 'admin' | 'hr' | 'canteen' | 'user') => Promise<{ success: boolean; error?: any }>;
}

const UserManagementModal = ({
  isOpen,
  onClose,
  pendingUsers,
  onUpdateRole
}: UserManagementModalProps) => {
  const handleRoleUpdate = async (userId: string, newRole: 'admin' | 'hr' | 'canteen' | 'user') => {
    const result = await onUpdateRole(userId, newRole);
    if (result.success) {
      console.log('Role updated successfully');
    } else {
      console.error('Failed to update role:', result.error);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'hr': return 'default';
      case 'canteen': return 'secondary';
      case 'user': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'user': return 'Basic User';
      case 'admin': return 'Admin';
      case 'hr': return 'HR';
      case 'canteen': return 'Canteen';
      default: return role;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            User Management
          </DialogTitle>
          <DialogDescription>
            Manage user roles and permissions. Users with "Basic User" role may need role assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found in the system.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <CardTitle className="text-lg">{user.username}</CardTitle>
                          {(user.first_name || user.last_name) && (
                            <CardDescription>
                              {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {format(new Date(user.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleUpdate(user.id, 'user')}
                          disabled={user.role === 'user'}
                        >
                          Basic User
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleUpdate(user.id, 'canteen')}
                          disabled={user.role === 'canteen'}
                        >
                          Canteen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleUpdate(user.id, 'hr')}
                          disabled={user.role === 'hr'}
                        >
                          HR
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRoleUpdate(user.id, 'admin')}
                          disabled={user.role === 'admin'}
                        >
                          Admin
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementModal;
